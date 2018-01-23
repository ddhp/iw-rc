const express = require('express');
const bodyParser = require('body-parser');
const raccoon = require('raccoon');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const UIDGenerator = require('uid-generator');
const redisClient = require('./lib/redis');
const client = require('./lib/postgres');

const router = express.Router();
const Movie = client.Movie;
const User = client.User;
const uidgen = new UIDGenerator();

function parseSequalizeResponse(sres) {
  const res = {};
  sres.map((r) => {
    return res[r.id] = r;
  })
  return res;
}

function ServerError(code, message) {
  this.code = code;
  this.message = message;
}

router.post('/login', bodyParser.json(), (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.find({where: {name: username}})
    .then((user) => {
      if (!user) {
        return Promise.resolve(res.status(400).json({
          message: 'username not found',
        }));
      } else {
        const expectedPw = user.password;
        res.__user__ = user.dataValues;
        return bcrypt.compare(password, expectedPw)
      }
    })
    .then((isMatched) => {
      if (isMatched) {
        delete res.__user__.password;
        // generate a token and save to redis
        const token = uidgen.generateSync();
        return Promise.all([
          redisClient.sadd(`user:${res.__user__.id}:tokens`, token),
          redisClient.set(`token:${token}`, res.__user__.id)
        ]);
      } else {
        throw new ServerError(400, 'password and username doesn\'t match');
      }
    })
    .then(() => {
      res.status(200).json(res.__user__);
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      })
    });
});

router.use('/signup', bodyParser.json(), (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const saltRounds = 10;
  // hash password
  bcrypt.hash(password, saltRounds)
    .then((hashedpw) => {
      return User.findOrCreate({where: {
        name: username, 
        password: hashedpw,
      }})
    })
    .then((response) => {
      const user = response[0];
      const created = response[1];
      if (created) {
        // generate a token and save to redis user
        res.__user__ = user.dataValues;
        const token = uidgen.generateSync();
        return Promise.all([
          redisClient.sadd(`user:${res.__user__.id}:tokens`, token),
          redisClient.set(`token:${token}`, res.__user__.id)
        ]);
      } else {
        throw new ServerError(400, `username ${username} already exists`);
      }
    })
    .then(() => {
      delete res.__user__.password;
      res.status(200).json({
        result: res.__user__.id,
        user: res.__user__,
      });
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      })
    });
});

router.get('/tryredis/:id', (req, res) => {
  const userId = req.params.id;
  redisClient.SMEMBERS(`user:${userId}:tokens`, (err, tokens) => {
    redisClient.get(`token:${tokens[0]}`, (err, userId) => {
      res.send({
        tokens,
        userId,
      });
    });
  });
});

router.patch('/movies/:id/ratings', bodyParser.json(), (req, res) => {
  const movieId = req.params.id;
  const score = req.body.score;
  const token = req.get('Authorization');
  let userId;
  console.log(score, token);
  // get userId from auth check/redis response
  redisClient.getAsync(`token:${token}`)
    .then((id) => {
      if (id === null) {
        throw new ServerError(401, 'unauthorized');
      } else {
        console.log('userId', id);
        userId = id;
        return Promise.all([
          raccoon.unliked(userId, movieId, {
            updateRecs: false
          }),
          raccoon.undisliked(userId, movieId, {
            updateRecs: false
          })
        ]);
      }
    })
    .then(() => {
      if (score > 3){
        return raccoon.liked(userId, movieId);
      } else {
        return raccoon.disliked(userId, movieId);
      }
    })
    .then(() => {
      return Promise.all([
        raccoon.recommendFor(userId, 10),
        raccoon.allLikedFor(userId),
      ]);
    })
    .then((response) => {
      const recs = response[0];
      const allLiked = response[1];
      res.__result__ = {
        recommendations: recs,
        allLiked: allLiked,
      };
      const concated = Array.prototype.concat(recs, allLiked);
      return Movie.findAll({ where: { id: concated } })
    })
    .then((movies) => {
      res.send({
        result: res.__result__,
        movies: parseSequalizeResponse(movies),
      })
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      })
    });
});

router.get('/users/:id/recommendations', bodyParser.json(), (req, res) => {
  const token = req.get('Authorization');
  let userId;
  // get userId from auth check/redis response
  redisClient.getAsync(`token:${token}`)
    .then((userId) => {
      if (userId === null) {
        throw new ServerError(401, 'unauthorized');
      } else {
        return raccoon.recommendFor(userId, 10)
      }
    })
    .then((recs) => {
      res.__result__ = recs;
      return Movie.findAll({ where: { id: recs } })
    })
    .then((movies) => {
      res.send({
        result: res.__result__,
        movies: parseSequalizeResponse(movies),
      })
    })
    .catch((err) => {
      const code = err.code || 500;
      res.status(code).json({
        message: err.message || 'something went wrong',
      })
    });
});

module.exports = router;
