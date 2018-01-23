const express = require('express');
const bodyParser = require('body-parser');
const raccoon = require('raccoon');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const redisClient = require('./lib/redis');
const client = require('./lib/postgres');

const router = express.Router();
const Movie = client.Movie;
const User = client.User;

function parseSequalizeResponse(sres) {
  const res = {};
  sres.map((r) => {
    return res[r.id] = r;
  })
  return res;
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
        // TODO: generate a token and save to redis user
        delete res.__user__.password;
        console.log(res.__user__);
        res.status(200).json(res.__user__);
      } else {
        res.status(400).json({
          message: 'password and username doesn\'t match',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({
        message: 'something went wrong',
      })
    });
});

router.use('/signup', bodyParser.json(), (req, res) => {
  const username = req.body.username;
  // TODO: hash password with secret
  const password = req.body.password;
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds)
    .then((hashedpw) => {
      return User.findOrCreate({where: {
        name: username, 
        password: hashedpw,
      }})
        .spread((user, created) => {
          if (created) {
            // TODO: generate a token and save to redis user
            delete user.dataValues.password;
            res.status(200).json({
              result: user.id,
              user: user.dataValues,
            });
          } else {
            res.status(400).json({
              message: `username ${username} already exists`
            });
          }
        });
    })
});

router.patch('/movies/:id/ratings', bodyParser.json(), (req, res) => {
  const movieId = req.params.id;
  const score = req.body.score;
  // TODO: get userId from auth check/redis response
  const userId = req.body.userId;
  console.log(score, userId);
  let p = Promise.all([
    raccoon.unliked(userId, movieId, {
      updateRecs: false
    }),
    raccoon.undisliked(userId, movieId, {
      updateRecs: false
    })
  ]);
  p
    .then(() => {
      if (score > 3){
        p = raccoon.liked(userId, movieId);
      } else {
        p = raccoon.disliked(userId, movieId);
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
    });
});

router.get('/users/:id/recommendations', (req, res) => {
  const userId = 'testId';
  raccoon.recommendFor(userId, 10)
    .then((recs) => {
      res.__result__ = recs;
      return Movie.findAll({ where: { id: recs } })
    })
    .then((movies) => {
      res.send({
        result: res.__result__,
        movies: parseSequalizeResponse(movies),
      })
    });
});

module.exports = router;
