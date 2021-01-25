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
		const uri = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
		const response = await fetch(uri, { method: 'get' });

        const data = await response.json();

		if (!data.result) {
            throw new Error('Oops');
        }

        const contractABI = JSON.parse(data.result);
        console.log(contractABI);
})();
