const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    'type': 'postgres',
    'host': process.env.DATABASE_HOSTNAME,
    'port': process.env.DATABASE_PORT,
    'username': process.env.DATABASE_USER,
    'password': process.env.DATABASE_PASSWORD,
    'database': process.env.DATABASE_NAME,
    'logging': process.env.DATABASE_LOGGING,
    "entities":  [
        __dirname + "/node_modules/@vulcanize/eth-watcher-ts/dist/models/*.js",
        __dirname + "/node_modules/@vulcanize/eth-watcher-ts/dist/models/**/*.js",
    ],
 }