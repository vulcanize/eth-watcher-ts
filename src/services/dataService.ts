
import to from 'await-to-js';
import { getConnection, Table } from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import * as abi from 'ethereumjs-abi';
import { keccak256, keccakFromHexString, rlp } from 'ethereumjs-util';
import Store from '../store';
import Event from '../models/contract/event';
import Contract from '../models/contract/contract';
import ProgressRepository from '../repositories/data/progressRepository';
import GraphqlService from './graphqlService';
import HeaderCids from '../models/eth/headerCids';
import TransactionCids from '../models/eth/transactionCids';
import TransactionCidsRepository from '../repositories/eth/transactionCidsRepository';
import HeaderCidsRepository from '../repositories/eth/headerCidsRepository';
import StateCids from '../models/eth/stateCids';
import State from '../models/contract/state';
import ApplicationError from '../errors/applicationError';
import StateProgressRepository from '../repositories/data/stateProgressRepository';
import Address from '../models/data/address';
import AddressRepository from '../repositories/data/addressRepository';
import AddressIdSlotIdRepository from '../repositories/data/addressIdSlotIdRepository';
import { MappingStructure, SimpleStructure, toStructure, toTableOptions } from './dataTypeParser';
import SlotRepository from '../repositories/data/slotRepository';

const LIMIT = 1000;


const INDEX = [
	'0000000000000000000000000000000000000000000000000000000000000000', // 0
	'0000000000000000000000000000000000000000000000000000000000000001',
	'0000000000000000000000000000000000000000000000000000000000000002',
	'0000000000000000000000000000000000000000000000000000000000000003',
	'0000000000000000000000000000000000000000000000000000000000000004',
	'0000000000000000000000000000000000000000000000000000000000000005',
	'0000000000000000000000000000000000000000000000000000000000000006',
	'0000000000000000000000000000000000000000000000000000000000000007',
	'0000000000000000000000000000000000000000000000000000000000000008',
	'0000000000000000000000000000000000000000000000000000000000000009',
	'000000000000000000000000000000000000000000000000000000000000000a', // 10
	'000000000000000000000000000000000000000000000000000000000000000b', // 11
	'000000000000000000000000000000000000000000000000000000000000000c', // 12
];

type ABIInput = {
	name: string;
	type: string;
	indexed: boolean;
	internalType: string;
}

type ABIInputData = {
	name: string;
	value?: any; // eslint-disable-line
}

type ABI = Array<{
	name: string;
	type: string;
	inputs: ABIInput[];
}>

export default class DataService {

	public async createTables(contracts: Contract[] = []): Promise<void> {
		for (const contract of contracts) {
			const events: Event[] = Store.getStore().getEventsByContractId(contract.contractId);
			for (const event of events) {
				await this._createEventTable(contract, event)
			}

			const states: State[] = Store.getStore().getStatesByContractId(contract.contractId);
			for (const state of states) {
				await this._createStateTable(contract, state)
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async addEvent (eventId: number, contractId: number, data: ABIInputData[], mhKey: string, blockNumber: number): Promise<void> {

		const tableName = DataService._getTableName({
			contractId,
			type: 'event',
			id: eventId
		});

		if (!data) {
			return;
		}

		return getConnection().transaction(async (entityManager) => {
			const sql = `INSERT INTO ${tableName}
(event_id, contract_id, mh_key, ${data.map((line) => 'data_' + line.name.toLowerCase().trim()).join(',')})
VALUES
(${eventId}, ${contractId}, '${mhKey}', '${data.map((line) => line.value.toString().replace(/\0/g, '')).join('\',\'')}');`;

			console.log(sql);

			const [err] = await to(entityManager.queryRunner.query(sql));
			if (err) {
				// TODO: throw err
				console.log(err);	
			}

			const progressRepository: ProgressRepository = entityManager.getCustomRepository(ProgressRepository);
			await progressRepository.add(contractId, eventId, blockNumber);
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async addState (contractId: number, mhKey: string, state: State, value: any, blockNumber: number): Promise<void> {
		const tableName = DataService._getTableName({
			contractId,
			type: 'state',
			id: state.stateId,
		});

		return getConnection().transaction(async (entityManager) => {
			const sql = `INSERT INTO ${tableName}
(state_id, contract_id, mh_key, slot_${state.slot})
VALUES
(${state.stateId}, ${contractId}, '${mhKey}', '${value}');`;

			console.log(sql);

			const [err] = await to(entityManager.queryRunner.query(sql));
			if (err) {
				// TODO: throw err
				console.log(err);	
			}

			const stateProgressRepository: StateProgressRepository = entityManager.getCustomRepository(StateProgressRepository);
			await stateProgressRepository.add(contractId, state.stateId, blockNumber);
		});
	}

	public static _getPgType(abiType: string): string {
		let pgType = 'TEXT';

		// Fill in pg type based on abi type
		switch (abiType.replace(/\d+/g, '')) {
			case 'address':
				pgType = 'character varying(66)';
				break;
			case 'int':
			case 'uint':
				pgType = 'numeric';
				break;
			case 'bool':
				pgType = 'boolean';
				break;
			case 'bytes':
				pgType = 'bytea';
				break;
			// case abi.ArrayTy:
			// 	pgType = 'text[]';
			// 	break;
			default:
				pgType = 'text';
		}

		return pgType;
	}

	public async processEvent(relatedNode): Promise<void> {

		if (!relatedNode) {
			return;
		}

		const header: HeaderCids = await this.processHeader(relatedNode?.ethTransactionCidByTxId?.ethHeaderCidByHeaderId);
		await this.processTransaction(relatedNode?.ethTransactionCidByTxId, header.id);

		if (!relatedNode.logContracts || !relatedNode.logContracts.length) {
			// TODO: mark as done?
			return;
		}

		const target = Store.getStore().getContracts().find((contract) => contract.address === relatedNode.logContracts[0]);
		if (!target || !target.events) {
			return;
		}

		const targetEvents: Event[] = Store.getStore().getEventsByContractId(target.contractId);
		for (const e of targetEvents) {
			const contractAbi = target.abi as ABI;
			const event = contractAbi.find((a) => a.name === e.name);

			if (!event) {
				continue;
			}

			const payload = `${event.name}(${event.inputs.map(input => input.internalType).join(',')})`;
			const hash = '0x' + keccak256(Buffer.from(payload)).toString('hex');

			console.log('payload', payload);
			console.log('hash', hash);

			if (relatedNode.topic0S && relatedNode.topic0S.length && (relatedNode.topic0S as Array<string>).includes(hash)) {
				const index = (relatedNode.topic0S as Array<string>).findIndex((topic) => topic === hash);

				if (relatedNode.blockByMhKey && relatedNode.blockByMhKey.data) {
					const buffer = Buffer.from(relatedNode.blockByMhKey.data.replace('\\x',''), 'hex');
					const decoded: any = rlp.decode(buffer); // eslint-disable-line

					// console.log(decoded[0].toString('hex'));
					// console.log(decoded[1].toString('hex'));
					// console.log(decoded[2].toString('hex'));

					const addressFromBlock = decoded[3][index][0].toString('hex');
					console.log('address', addressFromBlock);

					const hashFromBlock = decoded[3][index][1][0].toString('hex');
					console.log(hashFromBlock);

					const notIndexedEvents = event.inputs.filter(input => !input.indexed);
					const indexedEvents = event.inputs.filter(input => input.indexed);

					const messages = abi.rawDecode(notIndexedEvents.map(input => input.internalType), decoded[3][index][2]);

					const array: ABIInputData[] = [];
					indexedEvents.forEach((event, index) => {
						const topic = relatedNode[`topic${index + 1}S`][0].replace('0x','');

						try {
							array.push({
								name: event.name,
								value: abi.rawDecode([ event.internalType ], Buffer.from(topic, 'hex'))[0],
							});
						} catch (e) {
							console.log('Error wtih', event.name, event.internalType, e.message);
						}
					});
			
					notIndexedEvents.forEach((event, index) => {
						array.push({
							name: event.name,
							value: messages[index],
						});
					});

					await this.addEvent(
						e.eventId,
						target.contractId,
						array,
						relatedNode.mhKey,
						relatedNode.ethTransactionCidByTxId.ethHeaderCidByHeaderId.blockNumber
					);
					console.log('Event saved');
				}
			}
		}
	}

	public static async syncEventForContract({
		graphqlService, progressRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; progressRepository: ProgressRepository },
		event: Event,
		contract: Contract,
	): Promise<void> {
		const startingBlock = contract.startingBlock;
		const maxBlock = await progressRepository.getMaxBlockNumber(contract.contractId, event.eventId);
		const maxPage = Math.ceil(maxBlock / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await DataService._syncEventForContractPage(
				{
					graphqlService,
					progressRepository,
					dataService
				},
				event,
				contract,
				startingBlock,
				maxBlock,
				page,
			)
		}
	}

	private static async _syncEventForContractPage({
		graphqlService, progressRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; progressRepository: ProgressRepository },
		event: Event,
		contract: Contract,
		startingBlock: number,
		maxBlock: number,
		page: number,
		limit: number = LIMIT,
	): Promise<number[]> {
		const progresses = await progressRepository.findSyncedBlocks(contract.contractId, event.eventId, (page - 1) * limit, limit);

		const max = Math.min(maxBlock, page * limit); // max block for current page
		const start = startingBlock + (page -1) * limit; // start block for current page

		const allBlocks = Array.from({ length: max - start + 1 }, (_, i) => i + start);
		const syncedBlocks = progresses.map((p) => p.blockNumber);
		const notSyncedBlocks = allBlocks.filter(x => !syncedBlocks.includes(x));

		for (const blockNumber of notSyncedBlocks) {
			const header = await graphqlService.ethHeaderCidWithTransactionByBlockNumber(blockNumber);

			if (!header) {
				console.warn(`No header for ${blockNumber} block`);
				continue;
			}

			for (const ethHeader of header?.ethHeaderCidByBlockNumber?.nodes) {
				for (const tx of ethHeader.ethTransactionCidsByHeaderId.nodes) {
					await dataService.processEvent(tx.receiptCidByTxId);
				}
			}
		}

		return notSyncedBlocks;
	}

	public async processTransaction(ethTransaction, headerId: number): Promise<TransactionCids> {
		if (!ethTransaction) {
			return;
		}

		return getConnection().transaction(async (entityManager) => {
			const transactionCidsRepository: TransactionCidsRepository = entityManager.getCustomRepository(TransactionCidsRepository);
			const transaction = await transactionCidsRepository.add(headerId, ethTransaction);

			return transaction;
		});
	}

	public async processHeader(relatedNode: { td; blockHash; blockNumber; bloom; cid; mhKey; nodeId; ethNodeId; parentHash; receiptRoot; uncleRoot; stateRoot; txRoot; reward; timesValidated; timestamp }): Promise<HeaderCids> {

		if (!relatedNode) {
			return;
		}

		return getConnection().transaction(async (entityManager) => {
			const headerCidsRepository: HeaderCidsRepository = entityManager.getCustomRepository(HeaderCidsRepository);
			const header = await headerCidsRepository.add(relatedNode);

			return header;
		});
	}

	public async processState(relatedNode): Promise<StateCids> {

		if (!relatedNode || !relatedNode.stateLeafKey) {
			return;
		}

		console.log(JSON.stringify(relatedNode, null, 2));

		const contract = Store.getStore().getContractByAddressHash(relatedNode.stateLeafKey); // stateLeafKey keccak co.addres . sender 
		if (contract && relatedNode?.storageCidsByStateId?.nodes?.length) {
			const address = Store.getStore().getAddress(contract.address);
			const states = Store.getStore().getStatesByContractId(contract.contractId);

			for (const state of states) {
				const structure = toStructure(state.type, state.variable);

				console.log('structure', structure);

				const tableName = DataService._getTableName({
					contractId: contract.contractId,
					type: 'state',
					id: state.stateId,
				});
				const tableOptions = toTableOptions(tableName, toStructure(state.type, state.variable))
				console.log('tableOptions', JSON.stringify(tableOptions, null, 2));

				if (structure.type === 'mapping') {
					// const addressIdSlotIdRepository: AddressIdSlotIdRepository = new AddressIdSlotIdRepository(getConnection().createQueryRunner());					
					const slotRepository: SlotRepository = new SlotRepository(getConnection().createQueryRunner());

					for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
						console.log('storage.storageLeafKey', address.addressId, state.stateId, storage.storageLeafKey);
						// const addressId = await addressIdSlotIdRepository.getAddressIdByHash(address.addressId, state.stateId, storage.storageLeafKey);

						if (!storage.storageLeafKey) {
							continue;
						}

						const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
						const decoded: any = rlp.decode(buffer); // eslint-disable-line
						const value = abi.rawDecode([ 'uint' ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

						console.log(decoded);
						console.log(rlp.decode(Buffer.from(decoded[1], 'hex')));

						console.log(decoded[0].toString('hex'));
						console.log(value);

						const id = await slotRepository.add(tableOptions[0].name, [structure.name], [decoded[0].toString('hex')]);
						await slotRepository.add(tableOptions[1].name, [
							`${structure.name}_id`,
							structure.value.name,
						], [
							id,
							value,
						]);

						// await this.addState(contract.contractId, storage.blockByMhKey.key, state, value, relatedNode.ethHeaderCidByHeaderId.blockNumber);
					}
				} else if (structure.type === 'struct') {
					const slotRepository: SlotRepository = new SlotRepository(getConnection().createQueryRunner());

					let index = state.slot;
					const data: { name: string; value: any }[] = []; // eslint-disable-line
					for (const field of structure.fields) {
						if (field.type === 'simple') {
							const storageLeafKey = DataService._getKeyForFixedType(index);
							console.log('storageLeafKey', storageLeafKey);

							const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === storageLeafKey);
							if (!storage) {
								continue;
							}

							const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
							const decoded: any = rlp.decode(buffer); // eslint-disable-line

							console.log(decoded);
							const value = abi.rawDecode([ field.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

							data.push({
								name: field.name,
								value,
							})

							index++;
						} else {
							// TODO
						}
					}

					await slotRepository.add(tableOptions[0].name, data.map((d) => d.name), data.map((d) => d.value));
				} else if (structure.type === 'simple') {
					const storageLeafKey = DataService._getKeyForFixedType(state.slot);
					console.log('storageLeafKey', storageLeafKey);

					const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === storageLeafKey);
					console.log('storage', storage);
					if (!storage) {
						continue;
					}

					const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
					const decoded: any = rlp.decode(buffer); // eslint-disable-line
					const value = abi.rawDecode([ structure.kind ], Buffer.from(decoded[1], 'hex'))[0];

					console.log(decoded[0].toString('hex'));
					console.log(value);

					await this.addState(contract.contractId, storage.blockByMhKey.key, state, value, relatedNode.ethHeaderCidByHeaderId.blockNumber);
				}
			}
		}
	}

	public static async syncStatesForContract({
		graphqlService, stateProgressRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; stateProgressRepository: StateProgressRepository },
		state: State,
		contract: Contract,
	): Promise<void> {
		const startingBlock = contract.startingBlock;
		const maxBlock = await stateProgressRepository.getMaxBlockNumber(contract.contractId, state.stateId);
		const maxPage = Math.ceil(maxBlock / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await DataService._syncStatesForContractPage(
				{
					graphqlService,
					stateProgressRepository,
					dataService
				},
				state,
				contract,
				startingBlock,
				maxBlock,
				page,
			)
		}
	}

	private static async _syncStatesForContractPage({
		graphqlService, stateProgressRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; stateProgressRepository: StateProgressRepository },
		state: State,
		contract: Contract,
		startingBlock: number,
		maxBlock: number,
		page: number,
		limit: number = LIMIT,
	): Promise<number[]> {
		const progresses = await stateProgressRepository.findSyncedBlocks(contract.contractId, state.stateId, (page - 1) * limit, limit);

		const max = Math.min(maxBlock, page * limit); // max block for current page
		const start = startingBlock + (page -1) * limit; // start block for current page

		const allBlocks = Array.from({ length: max - start + 1 }, (_, i) => i + start);
		const syncedBlocks = progresses.map((p) => p.blockNumber);
		const notSyncedBlocks = allBlocks.filter(x => !syncedBlocks.includes(x));

		console.log('notSyncedBlocks', notSyncedBlocks);

		for (const blockNumber of notSyncedBlocks) {
			const header = await graphqlService.ethHeaderCidWithStateByBlockNumber(blockNumber);

			if (!header) {
				console.warn(`No header for ${blockNumber} block`);
				continue;
			}

			for (const ethHeader of header?.ethHeaderCidByBlockNumber?.nodes) {
				for (const state of ethHeader.stateCidsByHeaderId.nodes) {  
					await dataService.processState(state);
				}
			}
		}

		return notSyncedBlocks;
	}

	public static async syncHeaders({
		graphqlService, headerCidsRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; headerCidsRepository: HeaderCidsRepository }
	): Promise<void> {
		const startingHeaderId = 1;
		const maxHeaderId = await headerCidsRepository.getMaxHeaderId();
		const maxPage = Math.ceil(maxHeaderId / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await DataService._syncHeadersByPage(
				{
					graphqlService,
					headerCidsRepository,
					dataService
				},
				startingHeaderId,
				maxHeaderId,
				page,
			)
		}
	}

	protected static async _syncHeadersByPage({
		graphqlService, headerCidsRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; headerCidsRepository: HeaderCidsRepository },
		startingHeaderId: number,
		maxHeaderId: number,
		page: number,
		limit: number = LIMIT,
	): Promise<number[]> {
		const syncedHeaders = await headerCidsRepository.findSyncedHeaders((page - 1) * limit, limit);

		const max = Math.min(maxHeaderId, page * limit); // max header id for current page
		const start = startingHeaderId + (page -1) * limit; // start header id for current page

		const allHeaderIds = Array.from({ length: max - start + 1 }, (_, i) => i + start);
		const syncedIds= syncedHeaders.map((p) => p.id);
		const notSyncedIds = allHeaderIds.filter(x => !syncedIds.includes(x));

		for (const headerId of notSyncedIds) {
			const header = await graphqlService.ethHeaderCidById(headerId);
			await dataService.processHeader(header.ethHeaderCidById);
		}

		return notSyncedIds;
	}

	public async prepareAddresses(contracts: Contract[] = []): Promise<void> {
		const addressRepository: AddressRepository = getConnection().getCustomRepository(AddressRepository);
		const addressIdSlotIdRepository: AddressIdSlotIdRepository = new AddressIdSlotIdRepository(getConnection().createQueryRunner());

		for (const contract of contracts) {
			let address: Address = Store.getStore().getAddress(contract.address);
			if (!address) {
				const hash = '0x' + keccakFromHexString(contract.address).toString('hex');
				address = await addressRepository.add(contract.address, hash);
				Store.getStore().addAddress(address);
			}

			const states = Store.getStore().getStatesByContractId(contract.contractId);
			for (const state of states) {
				const structure = toStructure(state.type, state.variable);
				if (structure.type === 'mapping' || structure.type === 'struct') {
					await addressIdSlotIdRepository.createTable(address.addressId, state.stateId);
					const addresses: Address[] = Store.getStore().getAddresses();
					for (const adr of addresses) {
						const isExist = await addressIdSlotIdRepository.isExist(address.addressId,  state.stateId, adr.addressId);
						if (!isExist) {
							const hash = DataService._getKeyForMapping(adr.address, state.slot);
							await addressIdSlotIdRepository.add(address.addressId, adr.addressId, state.stateId, hash);	
						}
					}
				}
			}
		}
	}

	private static _getTableName({ contractId, type = 'event', id}): string {
		return `data.contract_id_${contractId}_${type}_id_${id}`;
	}

	private static _getTableOptions(contract: Contract, { event }: { event?: Event }): TableOptions {
		if (!event) {
			throw new ApplicationError('Bad params');
		}

		const tableName = this._getTableName({
			contractId: contract.contractId,
			type: 'event',
			id: event.eventId,
		});

		const tableOptions: TableOptions = {
				name: tableName,
				columns: [
					{
						name: 'id',
						type: 'integer',
						isPrimary: true,
						isGenerated: true,
						generationStrategy: 'increment'
					}, {
						name: 'contract_id',
						type: 'integer',
					}, {
						name: 'mh_key',
						type: 'text',
					},
				]
			};

			tableOptions.columns.push({
				name: 'event_id',
				type: 'integer',
			});

			const data: ABIInput[] = (contract.abi as ABI)?.find((e) => e.name === event.name)?.inputs;
			data.forEach((line) => {
				tableOptions.columns.push({
					name: `data_${line.name.toLowerCase().trim()}`,
					type: this._getPgType(line.internalType),
					isNullable: true,
				});
			});

			return tableOptions;
	}

	private async _createEventTable(contract: Contract, event: Event): Promise<void> {
		return getConnection().transaction(async (entityManager) => {
			const tableName = DataService._getTableName({
				contractId: contract.contractId,
				type: 'event',
				id: event.eventId
			});
			const table = await entityManager.queryRunner.getTable(tableName);

			if (table) {
				console.log(`Table ${tableName} already exists`);
				return;
			}

			const tableOptions = DataService._getTableOptions(contract, { event });
			await entityManager.queryRunner.createTable(new Table(tableOptions), true);
			console.log('create new table', tableName);
		});
	}

	private async _createStateTable(contract: Contract, state: State): Promise<void> {
		return getConnection().transaction(async (entityManager) => {
			const tableName = DataService._getTableName({
				contractId: contract.contractId,
				type: 'state',
				id: state.stateId,
			});
			const table = await entityManager.queryRunner.getTable(tableName);

			if (table) {
				console.log(`Table ${tableName} already exists`);
				return;
			}

			const tableOptions = toTableOptions(tableName, toStructure(state.type, state.variable))
			await Promise.all(
				tableOptions.map((t) => entityManager.queryRunner.createTable(new Table(t), true))
			);
			console.log('create new table', tableName);
		});
	}

	private static _getKeyForFixedType(slot: number): string {
		if (!INDEX[slot]) {
			return null;
		}

		return '0x' + keccak256(Buffer.from(INDEX[slot], 'hex')).toString('hex');
	}

	private static _getKeyForMapping(address: string, slot: number, withHotFix = true): string {
		if (!INDEX[slot]) {
			return null;
		}

		const zero64 = '0000000000000000000000000000000000000000000000000000000000000000';
		const adrStr = (zero64.substring(0, zero64.length - address.length) + address.replace('0x', '0')).toLowerCase();

		const hash = '0x' + keccakFromHexString('0x' + adrStr + INDEX[slot]).toString('hex');
		if (!withHotFix) {
			return hash;
		}

		// TODO: !!! REMOVE HOT-FIX !!!
		return '0x' + keccakFromHexString(hash).toString('hex');
	}

}
