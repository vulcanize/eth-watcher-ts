import fetch from 'node-fetch';

const args = process.argv.slice(2);

const apiKey = args[0];
const address = args[1];

console.log('API Key: ', apiKey);
console.log('Address: ', address);

if (!apiKey) {
    throw new Error('Api Key is required');
}

if (!address) {
    throw new Error('Address is required');
}

(async (): Promise<void> => {
    const uri = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
    const response = await fetch(uri, { method: 'get' });

    const data = await response.json();

    if (!data.result || data.result.length === 0) {
        throw new Error('Oops');
    }

    const contract = data.result[0];

    const contractName = contract.ContractName;
    const contractABI = JSON.parse(contract.ABI);
    const sourceCode = contract.SourceCode;

    console.log(contractName);
    console.log(contractABI);
    console.log(sourceCode);
})();

(async (): Promise<void> => {
    const uri = `https://api.etherscan.io/api?module=account&action=txlist&page=1&offset=3&sort=asc&address=${address}&apikey=${apiKey}`
    const response = await fetch(uri, { method: 'get' });

    const data = await response.json();

    if (!data.result || data.result.length === 0) {
        throw new Error('Oops');
    }

    const firstTx = data.result[0];
    const blockNumber = firstTx.blockNumber;

    console.log('First block number', blockNumber);
})();