module.exports = {
    'type': 'postgres',
    'host': process.env.TYPEORM_HOST,
    'port': process.env.TYPEORM_PORT,
    'username': process.env.TYPEORM_USERNAME,
    'password': process.env.TYPEORM_PASSWORD,
    'database': process.env.TYPEORM_DATABASE,
    'logging': process.env.TYPEORM_LOGGING,
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