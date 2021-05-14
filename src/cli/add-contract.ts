import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import yargs from 'yargs';
import { createConnection, getConnectionOptions } from 'typeorm';

import ContractService from '../services/contractService';

const argv = yargs.parserConfiguration({
    "parse-numbers": false
}).options({
    name: {
        type: 'string',
        require: true,
        demandOption: true,
        describe: 'Name of the contract'
    },
    address: {
        type: 'string',
        require: true,
        demandOption: true,
        describe: 'Address of the deployed contract'
    },
    sourcePath: {
        type: 'string',
        require: true,
        demandOption: true,
        describe: 'Path to the flattened Solidity source file for the contract'
    },
    artifactPath: {
        type: 'string',
        require: true,
        demandOption: true,
        describe: 'Path to the compiled artifact file for the contract'
    },
    startingBlock: {
        type: 'number',
        default: 1,
        describe: 'Starting block'
    },
    compilerVersion: {
        type: 'string',
        default: '',
        describe: 'Solidity compiler version'
    },
    runBackfiller: {
        type: 'boolean',
        default: false,
        describe: 'Run backfiller'
    }
}).argv;

(async (): Promise<void> => {
	const connectionOptions = await getConnectionOptions();
	createConnection(connectionOptions).then(async () => {
        const { name, address, sourcePath, artifactPath, startingBlock, compilerVersion, runBackfiller } = argv;

        const contracts = [];

        const sourceCode = fs.readFileSync(sourcePath, { encoding: 'utf8' });
        const abi = JSON.parse(fs.readFileSync(artifactPath, { encoding: 'utf8' })).abi;
        const contract = {
            name,
            address,
            startingBlock,
            sourceCode,
            abi,
            compilerVersion,
        };

        contracts.push(contract);

        const contractService = new ContractService();
        const data = await contractService.addContracts(null, contracts, runBackfiller);
        console.log(data);
    });
})();

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
