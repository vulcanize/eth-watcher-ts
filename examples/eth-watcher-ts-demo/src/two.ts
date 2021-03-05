import * as dotenv from 'dotenv';
dotenv.config();

import { EthWatcherServer } from "@vulcanize/eth-watcher-ts/dist/server";

(async () => {
    await EthWatcherServer({ // DI
        processState: (data) => console.log('Test state', data),
        processHeader: (data) => console.log('Test header', data),
        processEvent: (data) => console.log('Test event', data),
    }, {
        DATABASE_HOSTNAME: 'localhost',
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_PORT: 8068
    })
})();
