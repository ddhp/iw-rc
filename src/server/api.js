/* eslint no-underscore-dangle: 0 */
const express = require('express');
const bodyParser = require('body-parser');
const raccoon = require('raccoon');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const UIDGenerator = require('uid-generator');
const path = require('path');
const jsonfile = require('jsonfile');
const redisClient = require('./lib/redis');
const client = require('./lib/postgres');
const stdout = require('../stdout').default;

const router = express.Router();
const {
  Movie,
  User,
} = client;
const uidgen = new UIDGenerator();
const debug = stdout('server:api');

const top10File = path.join(__dirname, '../../ml-latest-small/top10.json');
const top10 = jsonfile.readFileSync(top10File);
const top10Ids = top10.map(t => t.id);

function parseSequalizeResponse(sres) {
  const res = {};
  sres.map((r) => {
    res[r.id] = r;
    return true;
  });
  return res;
}

function ServerError(code, message) {
  this.code = code;
  this.message = message;
}

router.post('/login', bodyParser.json(), (req, res) => {
  const {
    username,
    password,
  } = req.body;
  User.find({ where: { name: username }, attributes: ['id', 'name', 'password'] })
    .then((user) => {
      if (!user) {
        return Promise.resolve(res.status(400).json({
          message: 'username not found',
        }));
      }
      const expectedPw = user.password;
      res.__user__ = user.dataValues;
      return bcrypt.compare(password, expectedPw);
    })
    .then((isMatched) => {
      if (isMatched) {
        delete res.__user__.password;
        // generate a token and save to redis
        const token = uidgen.generateSync();
        res.__user__.token = token;
        return Promise.all([
          redisClient.sadd(`user:${res.__user__.id}:tokens`, token),
          redisClient.set(`token:${token}`, res.__user__.id),
        ]);
      }
      throw new ServerError(400, 'password and username doesn\'t match');
    })
    .then(() => {
      const user = res.__user__;
      res.status(200).json({
        result: user.id,
        entities: {
          users: {
            [user.id]: user,
          },
        },
      });
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      });
    });
});

router.use('/signup', bodyParser.json(), (req, res) => {
  const {
    username,
    password,
  } = req.body;
  const saltRounds = 10;
  let userInstance;
  User.findOrCreate({
    where: {
      name: username,
    },
  })
    .then((response) => {
      userInstance = response[0];
      const created = response[1];
      debug('created', created);
      if (created) {
        // hash password
        return bcrypt.hash(password, saltRounds);
      }
      throw new ServerError(400, `username ${username} already exists`);
    })
    .then(hashedpw => userInstance.update({
      password: hashedpw,
    }))
    .then((user) => {
      debug('after update', user.get());
      // generate a token and save to redis user
      res.__user__ = user.get();
      const token = uidgen.generateSync();
      res.__user__.token = token;
      return Promise.all([
        redisClient.sadd(`user:${res.__user__.id}:tokens`, token),
        redisClient.set(`token:${token}`, res.__user__.id),
      ]);
    })
    .then(() => {
      const user = res.__user__;
      delete user.password;
      delete user.updatedAt;
      delete user.createdAt;
      delete user.userId;
      res.status(200).json({
        result: user.id,
        entities: {
          users: {
            [user.id]: user,
          },
        },
      });
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      });
    });
});

router.get('/tryredis/:id', (req, res) => {
  const userId = req.params.id;
  redisClient.SMEMBERS(`user:${userId}:tokens`, (err, tokens) => {
    redisClient.get(`token:${tokens[0]}`, (error, id) => {
      res.send({
        tokens,
        userId: id,
      });
    });
  });
});

router.patch('/movies/:id/ratings', bodyParser.json(), (req, res) => {
  const movieId = req.params.id;
  const { score } = req.body;
  const token = req.get('Authorization');
  let userId;
  debug(score, token);
  // get userId from auth check/redis response
  redisClient.getAsync(`token:${token}`)
    .then((id) => {
      if (id === null) {
        throw new ServerError(401, 'unauthorized');
      } else {
        debug('userId', id);
        userId = id;
        return Promise.all([
          raccoon.unliked(userId, movieId, {
            updateRecs: false,
          }),
          raccoon.undisliked(userId, movieId, {
            updateRecs: false,
          }),
        ]);
      }
    })
    .then(() => {
      if (score >= 3) {
        return raccoon.liked(userId, movieId);
      }
      return raccoon.disliked(userId, movieId);
    })
    .then(() => Promise.all([
      raccoon.recommendFor(userId, 9),
      raccoon.allWatchedFor(userId),
    ]))
    .then((response) => {
      const recs = response[0];
      const allWatched = response[1];
      debug('recs', recs);
      res.__result__ = {
        recommendations: recs,
        allWatched,
      };
      const concated = Array.prototype.concat(recs, allWatched);
      return Movie.findAll({
        where: {
          id: concated,
        },
        attributes: ['id', 'title'],
      });
    })
    .then((movies) => {
      res.status(200).json({
        result: res.__result__,
        entities: {
          movies: parseSequalizeResponse(movies),
        },
      });
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      });
    });
});

router.get('/users/:id', (req, res) => {
  const token = req.get('Authorization');
  redisClient.getAsync(`token:${token}`)
    .then((userId) => {
      if (userId === null) {
        throw new ServerError(401, 'unauthorized');
      } else {
        return User.findById(userId, {
          attributes: ['id', 'name'],
        });
      }
    })
    .then((user) => {
      if (!user) {
        throw new Error();
      }
      res.__user__ = user.dataValues;
      return raccoon.allWatchedFor(user.id);
    })
    .then((allWatched) => {
      res.__user__.liked = allWatched;
      debug('allWatched');
      debug(allWatched);
      return Movie.findAll({
        where: {
          id: allWatched,
        },
        attributes: ['id', 'title'],
      });
    })
    .then((movies) => {
      const user = res.__user__;
      debug(user);
      res.status(200).json({
        result: user.id,
        entities: {
          users: {
            [user.id]: user,
          },
          movies: parseSequalizeResponse(movies),
        },
      });
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      });
    });
});

router.get('/users/:id/recommendations', bodyParser.json(), (req, res) => {
  const token = req.get('Authorization');
  // get userId from auth check/redis response
  redisClient.getAsync(`token:${token}`)
    .then((userId) => {
      if (userId === null) {
        throw new ServerError(401, 'unauthorized');
      } else {
        return raccoon.recommendFor(userId, 9);
      }
    })
    .then((recs) => {
      if (recs.length > 0) {
        res.__result__ = recs;
        return Movie.findAll({ where: { id: recs }, attributes: ['id', 'title'] });
      }
      return Movie.findAll({ where: { movieId: top10Ids }, attributes: ['id', 'title'] })
        .then((movies) => {
          res.__result__ = movies.map(m => m.id);
          return movies;
        });
    })
    .then((movies) => {
      res.status(200).json({
        result: res.__result__,
        entities: {
          movies: parseSequalizeResponse(movies),
        },
      });
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      });
    });
});

module.exports = router;
