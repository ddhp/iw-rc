// import { get as _get } from 'lodash';
import request from 'superagent';
import cookie from 'js-cookie';
import stdout from '../stdout';

const debug = stdout('action');

function setTokenInCookies(token) {
  return {
    type: 'SET_TOKEN_IN_COOKIES',
    payload: token,
  };
}

function login(username, password) {
  return dispatch => request
    .post('/api/login')
    .send({ username, password })
    .then((res) => {
      debug(res.text);
      const userInfo = JSON.parse(res.text);
      const user = userInfo.entities.users[userInfo.result];
      cookie.set('token', user.token);
      return dispatch({
        type: 'LOGIN',
        payload: user,
      });
    }, (err) => {
      throw err;
    });
}

function signup(username, password) {
  return dispatch => request
    .post('/api/signup')
    .send({ username, password })
    .then((res) => {
      debug(res.text);
      const userInfo = JSON.parse(res.text);
      const user = userInfo.entities.users[userInfo.result];
      cookie.set('token', user.token);
      return dispatch({
        type: 'LOGIN',
        payload: user,
      });
    }, (err) => {
      throw err;
    });
}

function getRecommendations(token) {
  return dispatch => request
    .get('/api/users/me/recommendations')
    .set({
      Authorization: token,
    })
    .send()
    .then((res) => {
      debug(res);
      return dispatch({
        type: 'GET_RECOMMENDATIONS',
        payload: JSON.parse(res.text),
      });
    });
}

function getMe(token) {
  return dispatch => request
    .get('/api/users/me')
    .set({
      Authorization: token,
    })
    .send()
    .then((res) => {
      debug(res);
      return dispatch({
        type: 'GET_ME',
        payload: JSON.parse(res.text),
      });
    });
}

function rateMovie(movieId, rating, token) {
  return dispatch => request
    .patch(`/api/movies/${movieId}/ratings`)
    .set({
      Authorization: token,
    })
    .send({
      score: rating,
    })
    .then(res => (
      dispatch({
        type: 'RATE_MOVIE',
        payload: JSON.parse(res.text),
      })
    ));
}

export default {
  setTokenInCookies,
  login,
  signup,
  getRecommendations,
  getMe,
  rateMovie,
};
