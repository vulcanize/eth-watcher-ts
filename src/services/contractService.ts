
import fetch from 'node-fetch';
import { getConnection } from 'typeorm';
import Contract from '../models/contract/contract';
import Event from '../models/contract/event';
import Method from '../models/contract/method';
import State from '../models/contract/state';
import Address from '../models/data/address';
import ContractRepository from '../repositories/contract/contractRepository';
import EventRepository from '../repositories/contract/eventRepository';
import MethodRepository from '../repositories/contract/methodRepository';
import StateRepository from '../repositories/contract/stateRepository';
import AddressRepository from '../repositories/data/addressRepository';
import { ABI } from "../types/abi";

const childProcess = require('child_process'); // eslint-disable-line
const tmp = require('tmp'); // eslint-disable-line
const fs = require('fs'); // eslint-disable-line

export default class ContractService {

	public async loadContracts (contractIds?: number[]): Promise<Contract[]> {
		const contractRepository: ContractRepository = getConnection().getCustomRepository(ContractRepository);

		if (!contractIds) {
			return await contractRepository.findAll();
		}
		const contracts = await contractRepository.findByIds(contractIds);

		return contracts;
	}

	public async loadEvents (): Promise<Event[]> {
		const eventRepository: EventRepository = getConnection().getCustomRepository(EventRepository);
		const events = await eventRepository.findAll();

		return events;
	}

	public async loadMethods (): Promise<Method[]> {
		const methodRepository: MethodRepository = getConnection().getCustomRepository(MethodRepository);
		const methods = await methodRepository.findAll();

		return methods;
	}

	public async loadStates (): Promise<State[]> {
		const stateRepository: StateRepository = getConnection().getCustomRepository(StateRepository);
		return stateRepository.findAll();
	}

	public async loadAddresses (): Promise<Address[]> {
		const addressRepository: AddressRepository = getConnection().getCustomRepository(AddressRepository);
		return addressRepository.findAll();
	}

	public async addContracts (apiKey: string, addresses: string[]): Promise<{ success; fail }> {
		const eventRepository: EventRepository = getConnection().getCustomRepository(EventRepository);
		const contractRepository: ContractRepository = getConnection().getCustomRepository(ContractRepository);

		const success = [];
		const fail = [];
		const contractIds = [];

		for (const address of addresses) {
			try {
				const data = await this.getContractDataFromEtherscan(apiKey, address);
				const startingBlock = await this.getStartingBlockFromEtherscan(apiKey, address);

				const solFile = tmp.fileSync({ prefix: 'contract-', postfix: '.sol' });
				fs.writeFileSync(solFile.name, data.sourceCode);

				// TODO: fix this call
				// await this.parseSourceCode(tmpObj.name);

				const eventIds: number[] = [];
				const eventNames: string[] = this.getEventsFromABI(data.abi);
				
				for (const name of eventNames) {
					const event = await eventRepository.add({ name });
					eventIds.push(event.eventId);
				}

				const contract = await contractRepository.add({
					address,
					startingBlock,
					name: data.name,
					abi: data.abi,
					events: eventIds,
					// TODO: add slots
				});

				contractIds.push(contract.contractId);
				success.push(address);
			} catch (e) {
				console.log(e);
				fail.push(address);
			} 
		}

		if (contractIds && contractIds.length) {
			this.runBackfillService(contractIds);
		}

		return {
			success,
			fail
		}
	}

	private async getStartingBlockFromEtherscan (apiKey: string, address: string): Promise<number> {
		const uri = `https://api.etherscan.io/api?module=account&action=txlist&page=1&offset=3&sort=asc&address=${address}&apikey=${apiKey}`;
		const response = await fetch(uri, { method: 'get' });
		const data = await response.json();

		if (!data.result || data.result.length === 0) {
			throw new Error('Oops, something wrong with etherscan API');
		}

		const firstTx = data.result[0];

		if (!firstTx) {
			throw new Error('Wrong contract address');
		}
		const blockNumber = firstTx.blockNumber;

		if (!blockNumber) {
			throw new Error('Wrong contract address');
		}

		return blockNumber;
	}

	private async getContractDataFromEtherscan (apiKey: string, address: string): Promise<{ name; abi; sourceCode }> {
		const uri = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
		const response = await fetch(uri, { method: 'get' });

		const data = await response.json();

		console.log(data.result.length)
		if (!data.result || data.result.length === 0) {
			throw new Error('Oops');
		}

		const contract = data.result[0];

		if (!contract) {
			throw new Error('Wrong contract address');
		}

		return {
			name: contract.ContractName,
			abi: contract.ABI ? JSON.parse(contract.ABI) : null,
			sourceCode: contract.SourceCode,
		};
	}

	private async runBackfillService(contractIds: number[]): Promise<any> {
		// VUL-202 Run backfill service for specific contractIds
		return new Promise((resolve, reject) => {
			const workerProcess = childProcess.spawn('npx', ['ts-node', './src/backfillService.ts', ...contractIds]);
			
			workerProcess.stdout.on('data', function (data) {
				console.log('stdout: ' + data);
			});
			
			workerProcess.stderr.on('data', function (data) {
				console.log('stderr: ' + data);
			});
			
			workerProcess.on('close', function (code) {
				if (code === 0) {
					resolve(code);
				} else {
					reject(code);
				}
			});
		})
	}

	private async parseSourceCode(path: string): Promise<any> {
		// VUL-202 Run backfill service for specific contractIds
		return new Promise((resolve, reject) => {
			const workerProcess = childProcess.spawn('slither', [path, '--print', 'variable-order']);
			
			workerProcess.stdout.on('data', function (data) {
				console.log('stdout: ' + data);
			});
			
			workerProcess.stderr.on('data', function (data) {
				console.log('stderr: ' + data);
			});
			
			workerProcess.on('close', function (code) {
				if (code === 0) {
					resolve(code);
				} else {
					reject(code);
				}
			});
		})
	}

	private getEventsFromABI(abi: ABI): string[] {
		if (!abi) {
			return [];
		}

		const events = abi.filter((item) => item.type ===  'event');
		return (events || []).map((item) => item.name);
	}

}
