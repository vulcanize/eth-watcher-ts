const Config = require('./src/config').default; // eslint-disable-line
const env = Config.getEnv();

module.exports = {
    'type': 'postgres',
    'host': env.DATABASE_HOSTNAME,
    'port': env.DATABASE_PORT,
    'username': env.DATABASE_USER,
    'password': env.DATABASE_PASSWORD,
    'database': env.DATABASE_NAME,
    'logging': env.DATABASE_LOGGING,
    extra: {
        max: 100,
        idleTimeoutMillis: 5000,
        //log: console.log
    },
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