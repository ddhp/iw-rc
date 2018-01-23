const express = require('express');
const bodyParser = require('body-parser');
const raccoon = require('raccoon');
const Promise = require('bluebird');
const client = require('./lib/postgres');

const router = express.Router();
const Movie = client.Movie;

function parseSequalizeResponse(sres) {
  const res = {};
  sres.map((r) => {
    return res[r.id] = r;
  })
  return res;
}

router.use('/login', (req, res) => {
  console.log('req.path', req.path);
  res.send(req.path);
});

router.use('/signup', (req, res) => {
  
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
