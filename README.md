# IW-RC
## Requirements
- Node.js 6.x
- Redis
- postgresql
## How to install locally
1. Clone the repo
2. Install dependencies
```
cd iw-rc
yarn
```
2a. Install a Redis (configure if necessary in lib/config.js)
```
brew install redis
```
2b. Install Postgres (configure if necessary in lib/config.js)
```
brew install postgres
```

3. Start up db / cache server
```
# Start up postgres server
postgres -D /usr/local/var/postgres

# Create a database
createdb intowow

# Start up redis server
redis-server
```

4. import data from movie lense
```
node src/server/lib/importMovieLense.js
```

5. start express server
```
node src/server/index.js
```

6. try it out, visit http://localhost:4321/

