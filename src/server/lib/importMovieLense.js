const raccoon = require('raccoon');
const path = require('path');
const jsonfile = require('jsonfile');
const Promise = require('bluebird');
const client = require('./postgres');
const redisClient = require('./redis');

const ratingsFile = path.join(__dirname, '../../../ml-latest-small/ratings.json');
const moviesFile = path.join(__dirname, '../../../ml-latest-small/movies.json');

const Movie = client.Movie;
const User = client.User;
const sequelize = client.sequelize;

redisClient.flushall();

sequelize.sync({ force: true }).then(() => {
  const ratingsSrc = jsonfile.readFileSync(ratingsFile);
  const moviesSrc = jsonfile.readFileSync(moviesFile);
  const users = {};
  const movies = {};

  // insert movies
  const insertMovie = data => Movie.create({ title: data.title, movieId: data.movieId })
    .then((res) => {
      const movie = res.dataValues;
      console.log('movie created', movie);
      return movies[movie.movieId] = movie;
    }).catch((err) => { console.log(err); });
  const insertMoviePromises = [];
  for (let i = 0; i < moviesSrc.length; i++) {
    const row = moviesSrc[i];
    insertMoviePromises.push(insertMovie(row));
  }

  // inset users
  const insertedUserIds = [];
  const insertUserPromises = [];
  for (let i = 0; i < ratingsSrc.length; i++) {
    const row = ratingsSrc[i];
    if (insertedUserIds.indexOf(row.userId) === -1) {
      insertedUserIds.push(row.userId);
      const p = User.create({
        userId: row.userId,
      }).then((res) => {
        const user = res.dataValues;
        console.log('user created', user);
        return users[user.userId] = user;
      });
      insertUserPromises.push(p);
    }
  }

  Promise.all(Array.prototype.concat(
    insertMoviePromises,
    insertUserPromises,
  )).then(() => {
    for (let i = 0; i < ratingsSrc.length; i++) {
      const ratingRow = ratingsSrc[i];
      const userId = users[ratingRow.userId].id;
      const movieId = movies[ratingRow.movieId].id;
      console.log(userId, movieId, ratingRow.rating);

      if (ratingRow.rating >= 3) {
        raccoon.liked(userId, movieId, {
          updateRecs: false,
        });
      } else {
        raccoon.disliked(userId, movieId, {
          updateRecs: false,
        });
      }
    }
    setTimeout(() => {
      process.exit();
    }, 10000);
  });
});
