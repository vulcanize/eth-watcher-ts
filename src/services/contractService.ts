
import { StateVariableDeclaration, StructDefinition } from 'solidity-parser-diligence';
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
import { structureToSignatureType } from './dataTypeParser';
import ApplicationError from "../errors/applicationError";

const childProcess = require('child_process'); // eslint-disable-line
const parser = require('@solidity-parser/parser'); // eslint-disable-line

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

	public async addContracts (apiKey: string, contracts: any[]): Promise<{ success; fail }> {
		const eventRepository: EventRepository = getConnection().getCustomRepository(EventRepository);
		const stateRepository: StateRepository = getConnection().getCustomRepository(StateRepository);
		const contractRepository: ContractRepository = getConnection().getCustomRepository(ContractRepository);

		const success = [];
		const fail = [];
		const contractIds = [];

		if (contracts.length > 5) {
			throw new ApplicationError('Max 5 addresses per request');
		}

		for (const contractObj of contracts) {
			try {
				if (contractObj?.compilerVersion.includes('vyper')) {
					fail.push(`${contractObj.address} : vyper`);
					continue;
				}

				// prepare events
				const eventIds: number[] = [];
				const eventNames: string[] = this.getEventsFromABI(contractObj.abi);
				for (const name of eventNames) {
					const event = await eventRepository.add({ name });
					eventIds.push(event.eventId);
				}

				// prepare states
				const stateIds: number[] = [];
				const stateObjects = await this.getStatesFromSourceCode(contractObj.sourceCode);
				for (const stateObject of stateObjects) {
					const state = await stateRepository.add({
						slot: stateObject.slot,
						type: stateObject.type,
						variable: stateObject.variable,
					});
					stateIds.push(state.stateId);
				}

				// TODO: check contract by address

				const contract = await contractRepository.add({
					address: contractObj.address,
					startingBlock: contractObj.startingBlock,
					name: contractObj.name,
					abi: contractObj.abi,
					events: eventIds,
					states: stateIds,
				});

				contractIds.push(contract.contractId);
				success.push(contractObj.address);
			} catch (e) {
				console.log(e);
				fail.push(contractObj.address);
			} 
		}

		if (contractIds && contractIds.length) {
			this.runBackfillService(contractIds); // async
		}

		return {
			success,
			fail
		}
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

	private async getStatesFromSourceCode(sourceCode: string): Promise<State[]> {
		const ast = parser.parse(sourceCode, {
			tolerant: true,
		});

		let list = [];
		const contractDefinitions = ast?.children?.filter((item) => item.type === 'ContractDefinition');
		for (const contractDefinition of contractDefinitions) {
			const states = contractDefinition?.subNodes.filter(n => n.type == 'StateVariableDeclaration') as StateVariableDeclaration[];
			const structs = contractDefinition?.subNodes.filter(n => n.type == 'StructDefinition') as StructDefinition[];
			
			list = list.concat(states?.map((item, slot) => {
				const type: string = structureToSignatureType(item.variables[0]?.name, item.variables[0]?.typeName, structs).signature;
				return {
					slot,
					type, 
					variable: item.variables[0]?.name,
				}
			}));
		}

		return list as State[];
	}

	private getEventsFromABI(abi: ABI): string[] {
		if (!abi) {
			return [];
		}

		const events = abi.filter((item) => item.type ===  'event');
		return (events || []).map((item) => item.name);
	}

}
