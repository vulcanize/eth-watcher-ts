const dotenv = require('dotenv');
dotenv.config();

const EthWatcher = require("@vulcanize/eth-watcher-ts");

(async () => {
    await EthWatcher.EthWatcherServer({ // DI
        processState: (data) => console.log('Test state', data),
        processHeader: (data) => console.log('Test header', data),
        processEvent: (data) => console.log('Test event', data),
    }, {
        DATABASE_HOSTNAME: 'localhost',
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_PORT: 8068
    });
})();
