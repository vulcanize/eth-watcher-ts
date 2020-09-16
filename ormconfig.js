const env = require('./src/env'); // eslint-disable-line

module.exports = {
    'type': 'postgres',
    'host': env.default.TYPEORM_HOST,
    'port': env.default.TYPEORM_PORT,
    'username': env.default.TYPEORM_USERNAME,
    'password': env.default.TYPEORM_PASSWORD,
    'database': env.default.TYPEORM_DATABASE,
    'logging': env.default.TYPEORM_LOGGING,
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