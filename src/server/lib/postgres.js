const Sequelize = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.postgresDbName,
  config.postgresUsername,
  config.postgresPassword, {
    host: config.postgresHost,
    dialect: 'postgres',
    pool: {
      max: 15,
      min: 0,
      acquire: 20000,
      idle: 20000,
    },
  },
);

const User = sequelize.define('user', {
  // id: {
  //   type: Sequelize.STRING,
  //   primaryKey: true,
  // },
  userId: Sequelize.STRING,
  name: Sequelize.STRING,
  password: Sequelize.STRING,
});

const Movie = sequelize.define('movie', {
  // id: {
  //   type: Sequelize.STRING,
  //   primaryKey: true,
  // },
  movieId: Sequelize.STRING,
  title: Sequelize.STRING,
});

module.exports = {
  sequelize,
  User,
  Movie,
};

