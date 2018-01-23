const express = require('express');
const apiMiddleware = require('./api');

const app = express();
app.use('/api', apiMiddleware);

const port = process.env.PORT || 4321;

const server = app.listen(port, () => {
  const host = server.address().address;
  const runningPort = server.address().port;

  console.log('express app listening at http://%s:%s', host, runningPort);
});
