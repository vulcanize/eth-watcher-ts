# Contract Watcher

## Requirements

[NodeJS](https://nodejs.org/en/)

## Getting Started

Set SSH connection to database

## Start the server

Run in development mode

```bash
npm run dev
```

Run in production mode

```bash
npm run prod
```

Run test

```bash
npm run test
```

Run code linter

```bash
npm run lint
```

## Dev notes

[TypeORM Migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md)

Create new migration

```bash
npx typeorm migration:create -n Name
```

Generate new migration by model

```bash
ts-node ./node_modules/typeorm/cli.js migration:generate -n Name
```

Generates models for TypeORM from existing databases

```bash
npx typeorm-model-generator -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o . -s public --ssl
```
