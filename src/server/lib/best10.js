const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const ratingsFile = path.join(__dirname, '../../../ml-latest-small/ratings.json');
const top10File = path.join(__dirname, '../../../ml-latest-small/top10.json');
const ratingsSrc = jsonfile.readFileSync(ratingsFile);
const map = {};
const top10 = [];
let hasReached10 = false;
const checkTop10 = (movie) => {
  if (top10.length < 10) {
    top10.push(movie);
    return;
  }
  if (top10.length === 10 && !hasReached10) {
    hasReached10 = true;
    return top10.sort((a, b) => {
      return b.score - a.score;
    });
  }
  if (movie.score > top10[9].score) {
    top10.pop();
    top10.push(movie);
    return top10.sort((a, b) => {
      return b.score - a.score;
    })
  }
}
ratingsSrc.map((r) => {
  const { rating, movieId } = r;
  const rfloat = parseFloat(rating, 10);
  if (!map[r.movieId]) {
    map[r.movieId] = 0;
  }
  if (rating >= 3) {
    map[r.movieId] += rfloat;
  } else {
    map[r.movieId] -= rfloat;
  }
})
Object.keys(map).map((key) => {
  checkTop10({
    score: map[key],
    id: key
  });
})
console.log(map);
console.log(top10);
fs.writeFile(top10File, JSON.stringify(top10), 'utf8', () => {
  process.exit();
});
