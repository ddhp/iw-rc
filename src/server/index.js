import cookieParser from 'cookie-parser';

const express = require('express');
const stdout = require('../stdout');
const apiMiddleware = require('./api');
const renderer = require('./renderer');
const stats = require('../../compilation-stats.json'); // eslint-disable-line

const debug = stdout('server:index');
const app = express();
app.use(cookieParser());
app.use('/api', apiMiddleware);

// Serve static files
app.use('/assets', express.static('dist/assets'));
app.use(renderer({ clientStats: stats }));

const port = process.env.PORT || 4321;

const server = app.listen(port, () => {
  const host = server.address().address;
  const runningPort = server.address().port;

  debug('express app listening at http://%s:%s', host, runningPort);
});
