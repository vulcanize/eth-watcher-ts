const env = require('./src/env'); // eslint-disable-line

module.exports = {
    'type': 'postgres',
    'host': env.default.DATABASE_HOSTNAME,
    'port': env.default.DATABASE_PORT,
    'username': env.default.DATABASE_USER,
    'password': env.default.DATABASE_PASSWORD,
    'database': env.default.DATABASE_NAME,
    'logging': env.default.DATABASE_LOGGING,
    "entities": process.env.NODE_ENV === 'production' ?
      [__dirname + "/dist/models/*.js", __dirname + "/dist/models/**/*.js",] :
      ["src/models/*.ts", "src/models/**/*.ts"],
    "migrations": process.env.NODE_ENV === 'production' ?
      [__dirname + "/dist/migrations/*.js"] :
      ["src/migrations/*.ts"],
    'cli': {
      'entitiesDir': 'src/models',
      'migrationsDir': 'src/migrations'
    }
 }