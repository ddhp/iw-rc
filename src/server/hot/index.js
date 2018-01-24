import express from 'express';
import cookieParser from 'cookie-parser';
import stdout from '../../stdout';
import apiMiddleware from '../api';
import hotMiddleware from './middleware';

const debug = stdout('server:index');

const app = express();

app.use(cookieParser());
app.use('/api', apiMiddleware);
hotMiddleware(app);

// import app from './app';
const port = process.env.PORT || 4321;

const server = app.listen(port, () => {
  const host = server.address().address;
  const runningPort = server.address().port;

  debug('express app listening at http://%s:%s', host, runningPort);
});
