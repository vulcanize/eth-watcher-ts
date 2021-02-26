const dotenv = require('dotenv');
dotenv.config();

const EthWatcherServer = require("@vulcanize/eth-watcher-ts");

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

(async () => {
    await EthWatcherServer({ // DI
        processState: (raw, decoded, meta) => console.log('Test state', raw, decoded, meta),
        processHeader: (raw) => console.log('Test header', raw),
        processEvent: (raw, decoded, meta) => console.log('Test event', raw, decoded, meta),
    }, {
        
    })
})();
