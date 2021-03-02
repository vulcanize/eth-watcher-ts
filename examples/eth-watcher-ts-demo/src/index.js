const dotenv = require('dotenv');
dotenv.config();

const EthWatcherServer = require("@vulcanize/eth-watcher-ts");

(async () => {
    await EthWatcherServer({ // DI
        processState: (data) => console.log('Test state', data),
        processHeader: (data) => console.log('Test header', data),
        processEvent: (data) => console.log('Test event', data),
    }, {

    })
})();
