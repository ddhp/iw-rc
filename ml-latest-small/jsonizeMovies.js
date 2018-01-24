const name = 'movies';

const csvjson = require('csvjson'),
  fs = require('fs'),
  path = require('path'),
  jsonfile = require('jsonfile');

const data = fs.readFileSync(path.join(__dirname, `./${name}.csv`), { encoding: 'utf8' });

const options = { delimiter: ',' };
const jsonData = csvjson.toObject(data, options);

const file = path.join(__dirname, `./${name}.json`);

jsonfile.writeFile(file, jsonData, (err) => {
  if (err) { console.log(err); }
});
