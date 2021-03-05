
import to from 'await-to-js';
import { getConnection, Table } from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import * as abi from 'ethereumjs-abi';
import { keccak256, keccakFromHexString, rlp, BN } from 'ethereumjs-util';
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
import { toStructure, toTableOptions } from './dataTypeParser';
import SlotRepository from '../repositories/data/slotRepository';
import EventRepository from '../repositories/data/eventRepository';
import DecodeService from './decodeService';
import {ABI, ABIElem, ABIInput, EthHeaderCid, EthReceiptCid, EthStateCid, EthTransactionCid} from "../types";
import BackfillProgressRepository from '../repositories/data/backfillProgressRepository';
import Method from "../models/contract/method";
import MethodProgressRepository from "../repositories/data/methodProgressRepository";
import MethodRepository from '../repositories/data/methodRepository';
import env from "../env";

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

type ABIInputData = {
	name: string;
	value?: any; // eslint-disable-line
}

export default class DataService {

	public async createTables(contracts: Contract[] = []): Promise<void> {
		for (const contract of contracts) {

			if (env.ENABLE_HEADER_WATCHER || env.ENABLE_EVENT_WATCHER) {
				const events: Event[] = Store.getStore().getEventsByContractId(contract.contractId);
				for (const event of events) {
					console.log('event', event);
					const [err] = await to(this._createEventTable(contract, event));
					err && console.warn(err);
				}
			}

			if (env.ENABLE_HEADER_WATCHER || env.ENABLE_STORAGE_WATCHER) {
				const states: State[] = Store.getStore().getStatesByContractId(contract.contractId);
				for (const state of states) {
					const [err] = await to(this._createStateTable(contract, state));
					err && console.warn(err);
				}
			}

			if (env.ENABLE_HEADER_WATCHER || env.ENABLE_METHODS_WATCHER) {
				const methods: Method[] = Store.getStore().getMethodsByContractId(contract.contractId);
				for (const method of methods) {
					const [err] = await to(this._createMethodTable(contract, method));
					err && console.warn(err);
				}
			}
		}
	}

	public async addEvent (eventId: number, contractId: number, headerId: number, data: ABIInputData[], mhKey: string, blockNumber: number): Promise<void> {
		if (!data) {
			return;
		}

		const tableName = DataService._getTableName({
			contractId,
			type: 'event',
			id: eventId
		});

		return getConnection().transaction(async (entityManager) => {
			const eventRepository: EventRepository = new EventRepository(entityManager.queryRunner);
			const progressRepository: ProgressRepository = entityManager.getCustomRepository(ProgressRepository);

			await eventRepository.add(tableName, [{
				name: 'event_id',
				value: eventId,
				isStrict: true,
			}, {
				name: 'contract_id',
				value: contractId,
				isStrict: true,
			}, {
				name: 'mh_key',
				value: mhKey,
				isStrict: true,
			}, {
				name: 'header_id',
				value: headerId,
				isStrict: true,
			},
			...data]);
			await progressRepository.add(contractId, eventId, blockNumber);
		});
	}

	public async addState (contractId: number, mhKey: string, state: State, value: string | number, blockNumber: number): Promise<void> {
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

	public async addMethod (methodId: number, contractId: number, data: {name; value}[]): Promise<void> {
		if (!data) {
			return;
		}

		const tableName = DataService._getTableName({
			contractId,
			type: 'method',
			id: methodId
		});

		const methodRepository: MethodRepository = new MethodRepository(getConnection().createQueryRunner());
		await methodRepository.add(tableName, data.map((d) => d.name), data.map((d) => d.value));
	}

	public static _getPgType(abiType: string): string {
		let pgType: string;

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

	public async processEvent(contract: Contract, relatedNode: EthReceiptCid, decoded: ABIInputData[], event: ABIElem): Promise<void> {
		if (!relatedNode || !decoded) {
			return;
		}

		const header: HeaderCids = await this.processHeader(relatedNode?.ethTransactionCidByTxId?.ethHeaderCidByHeaderId);
		await this.processTransaction(relatedNode?.ethTransactionCidByTxId, header.id);

		if (!relatedNode.logContracts || !relatedNode.logContracts.length) {
			// TODO: mark as done?
			return;
		}

		const target = contract || Store.getStore().getContracts().find((contract) => contract.address === relatedNode.logContracts[0]);
		if (!target || !target.events) {
			return;
		}
		const targetEvents: Event[] = Store.getStore().getEventsByContractId(target.contractId);

		const e = targetEvents.find((e) => e.name === event?.name);
		if (!e) {
			return;
		}

		await this.addEvent(
			e.eventId,
			target.contractId,
			header.id,
			decoded,
			relatedNode.mhKey,
			relatedNode.ethTransactionCidByTxId.ethHeaderCidByHeaderId.blockNumber
		);

		console.log(`Event ${event.name} saved`);
	}

	public static async syncEventForContract({
		graphqlService, progressRepository, dataService, backfillProgressRepository
	}: { graphqlService: GraphqlService; dataService: DataService; progressRepository: ProgressRepository; backfillProgressRepository?: BackfillProgressRepository },
		event: Event,
		contract: Contract,
	): Promise<void> {
		const startingBlock = contract.startingBlock;
		const { blockNumber } = await graphqlService.getLastBlock();
		const maxPage = Math.ceil((blockNumber - startingBlock) / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await to(DataService._syncEventForContractPage(
				{
					graphqlService,
					progressRepository,
					dataService
				},
				event,
				contract,
				startingBlock,
				blockNumber,
				page,
			));

			if (backfillProgressRepository) {
				const max = Math.min(blockNumber, page * LIMIT + startingBlock); // max block for current page
				const start = startingBlock + (page -1) * LIMIT; // start block for current page

				const currentProgress = await backfillProgressRepository.getProgress(contract.contractId);
				await backfillProgressRepository.updateProgress(contract.contractId, currentProgress + (max - start));
			}
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

		const max = Math.min(maxBlock, page * limit + startingBlock); // max block for current page
		const start = startingBlock + (page -1) * limit; // start block for current page

		const allBlocks = Array.from({ length: max - start + 1 }, (_, i) => i + start);
		const syncedBlocks = progresses.map((p) => p.blockNumber);
		const notSyncedBlocks = allBlocks.filter(x => !syncedBlocks.includes(x));

		for (const blockNumber of notSyncedBlocks) {
			const header = await graphqlService.ethHeaderCidWithTransactionByBlockNumber(blockNumber);

			if (!header || !header?.ethHeaderCidByBlockNumber?.nodes?.length) {
				console.warn(`No header for ${blockNumber} block`);
				continue;
			}

			for (const ethHeader of header?.ethHeaderCidByBlockNumber?.nodes) {
				for (const tx of ethHeader.ethTransactionCidsByHeaderId.nodes) {
					const result = await DecodeService.decodeReceiptCid(
						tx.receiptCidByTxId,
						() => Store.getStore().getContracts(),
						() => Store.getStore().getEvents(),
					);
					await dataService.processEvent(contract, result?.relatedNode, result?.decoded, result?.event);
				}
			}

			await progressRepository.add(contract.contractId, event.eventId, blockNumber);
		}

		return notSyncedBlocks;
	}

	public async processTransaction(ethTransaction: EthTransactionCid, headerId: number): Promise<TransactionCids> {
		if (!ethTransaction) {
			return;
		}

		return getConnection().transaction(async (entityManager) => {
			const transactionCidsRepository: TransactionCidsRepository = entityManager.getCustomRepository(TransactionCidsRepository);
			const transaction = await transactionCidsRepository.add(headerId, ethTransaction);

			return transaction;
		});
	}

	public async processHeader(relatedNode: EthHeaderCid): Promise<HeaderCids> {

		if (!relatedNode) {
			return;
		}

		return getConnection().transaction(async (entityManager) => {
			const headerCidsRepository: HeaderCidsRepository = entityManager.getCustomRepository(HeaderCidsRepository);
			const header = await headerCidsRepository.add(relatedNode);

			return header;
		});
	}

	// TODO: add decoded values
	public async processState(relatedNode: EthStateCid): Promise<StateCids> {

		if (!relatedNode || !relatedNode.stateLeafKey) {
			return;
		}

		console.log(JSON.stringify(relatedNode, null, 2));

		const contract = Store.getStore().getContractByAddressHash(relatedNode.stateLeafKey);
		if (contract && relatedNode?.storageCidsByStateId?.nodes?.length) {
			const contractAddress = Store.getStore().getAddress(contract.address);
			const states = Store.getStore().getStatesByContractId(contract.contractId);

			for (const state of states) {
				const structure = toStructure(state.type, state.variable);

				console.log('structure', structure);

				const tableName = DataService._getTableName({
					contractId: contract.contractId,
					type: 'state',
					id: state.stateId,
				});
				const tableOptions = toTableOptions(tableName, structure)
				console.log('tableOptions', JSON.stringify(tableOptions, null, 2));

				if (structure.type === 'mapping') {
					const addressIdSlotIdRepository: AddressIdSlotIdRepository = new AddressIdSlotIdRepository(getConnection().createQueryRunner());
					const slotRepository: SlotRepository = new SlotRepository(getConnection().createQueryRunner());

					if (structure.value.type === 'simple') {
						for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
							console.log('storage.storageLeafKey', contractAddress.addressId, state.stateId, storage.storageLeafKey);
							// const addressId = await addressIdSlotIdRepository.getAddressIdByHash(address.addressId, state.stateId, storage.storageLeafKey);

							if (!storage.storageLeafKey) {
								continue;
							}

							const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
							const decoded: any = rlp.decode(buffer); // eslint-disable-line
							const value = abi.rawDecode([ structure.value.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

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
						}
					} else if (structure.value.type === 'struct') {
						// asd mapping -> struct
						console.log('structure.value', structure.value.fields);

						let storageLeafKey;
						let addressId;
						for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
							addressId = await addressIdSlotIdRepository.getAddressIdByHash(contractAddress.addressId, state.stateId, storage.storageLeafKey);

							if (!addressId) {
								continue;
							}

							storageLeafKey = storage.storageLeafKey;
						}

						const address = Store.getStore().getAddressById(addressId);
						const id = await slotRepository.add(tableOptions[0].name, [structure.name], [address.address]);

						const hashes = [storageLeafKey];
						const correctStorageLeafKey = DataService._getKeyForMapping(address.address, state.slot, false);
						for (let i = 1; i < structure.value.fields.length; i++) {
							const x = new BN(correctStorageLeafKey.replace('0x',''), 'hex');
							const sum = x.addn(i);
							const key = '0x' + sum.toString(16);
							hashes.push('0x' + keccakFromHexString(key).toString('hex'));
						}

						let index = state.slot;
						const data: { name: string; value: any }[] = []; // eslint-disable-line
						for (const field of structure.value.fields) {
							if (field.type === 'simple') {
								const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === hashes[index]);
								console.log('storageLeafKey', hashes[index]);
								index++;

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
								});
							} else {
								// TODO:
							}
						}

						console.log('data', data);
						await slotRepository.add(tableOptions[1].name,
							[`${structure.name}_id`, ...data.map((d) => d.name)],
							[id, ...data.map((d) => d.value)]
						);
					} else {
						// TODO
					}
				} else if (structure.type === 'struct') {
					const slotRepository: SlotRepository = new SlotRepository(getConnection().createQueryRunner());

					let index = state.slot;
					const data: { name: string; value: any }[] = []; // eslint-disable-line
					for (const field of structure.fields) {
						if (field.type === 'simple') {
							const storageLeafKey = DataService._getKeyForFixedType(index);
							console.log('storageLeafKey', storageLeafKey);
							index++;

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
							});
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
					const value = abi.rawDecode([ structure.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

					console.log(decoded[0].toString('hex'));
					console.log(value);

					await this.addState(contract.contractId, storage.blockByMhKey.key, state, value, relatedNode.ethHeaderCidByHeaderId.blockNumber);
				}
			}
		}
	}

	public static async syncStatesForContract({
		graphqlService, stateProgressRepository, dataService, backfillProgressRepository
	}: { graphqlService: GraphqlService; dataService: DataService; stateProgressRepository: StateProgressRepository; backfillProgressRepository?: BackfillProgressRepository },
		state: State,
		contract: Contract,
	): Promise<void> {
		const startingBlock = contract.startingBlock;
		const { blockNumber } = await graphqlService.getLastBlock();
		const maxPage = Math.ceil((blockNumber - startingBlock) / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await to(DataService._syncStatesForContractPage(
				{
					graphqlService,
					stateProgressRepository,
					dataService
				},
				state,
				contract,
				startingBlock,
				blockNumber,
				page,
			));

			if (backfillProgressRepository) {
				const max = Math.min(blockNumber, page * LIMIT + startingBlock); // max block for current page
				const start = startingBlock + (page -1) * LIMIT; // start block for current page

				const currentProgress = await backfillProgressRepository.getProgress(contract.contractId);
				await backfillProgressRepository.updateProgress(contract.contractId, currentProgress + (max - start));
			}
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

		const max = Math.min(maxBlock, page * limit + startingBlock); // max block for current page
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
					const result = await DecodeService.decodeStateCid(
						state,
						() => Store.getStore().getContracts(),
						() => Store.getStore().getStates(),
					);
					await dataService.processState(result.relatedNode, result.decoded);
				}
			}

			await stateProgressRepository.add(contract.contractId, state.stateId, blockNumber);
		}

		return notSyncedBlocks;
	}

	public static async syncHeaders({
		graphqlService, headerCidsRepository, dataService
	}: { graphqlService: GraphqlService; dataService: DataService; headerCidsRepository: HeaderCidsRepository }
	): Promise<void> {
		const startingHeaderId = 1;
		const { headerId } = await graphqlService.getLastBlock();
		const maxPage = Math.ceil((headerId - startingHeaderId) / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await DataService._syncHeadersByPage(
				{
					graphqlService,
					headerCidsRepository,
					dataService
				},
				startingHeaderId,
				headerId,
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

		const max = Math.min(maxHeaderId, page * limit + startingHeaderId); // max header id for current page
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

	public async processMethod(relatedNode, decoded = []): Promise<void> {
		if (!relatedNode || !decoded) {
			return;
		}

		const targetContract = Store.getStore().getContracts().find((contract) =>
			contract.address === relatedNode.dst?.toLowerCase() ||
			contract.address === relatedNode.src?.toLowerCase()
		);
		if (!targetContract) {
			return;
		}

		const targetMethods = Store.getStore().getMethods().filter((method) => targetContract.methods.includes(method.methodId));
		if (!targetContract || !targetMethods || targetMethods.length === 0) {
			return;
		}

		const contractAbi = targetContract.abi as ABI;
		for (const d of decoded) {
			const method = contractAbi.find((a) => a.name === d.name);
			if (!method) {
				continue;
			}

			const payload = `${method.name}(${method.inputs.map(input => input.type).join(',')})`;
			const m = targetMethods.find((e) => e.name === payload);

			await this.addMethod(
				m.methodId,
				targetContract.contractId,
				[{
					name: 'dst',
					value: relatedNode.dst,
				}, {
					name: 'src',
					value: relatedNode.src,
				}, {
					name: 'input',
					value: relatedNode.input,
				}, {
					name: 'output',
					value: relatedNode.output,
				}, {
					name: 'gas_used',
					value: relatedNode.gasUsed,
				}, {
					name: 'value',
					value: relatedNode.value,
				}, {
					name: 'opcode',
					value: relatedNode.opcode,
				}]
			);

			console.log('Method saved');
		}
	}

	public static async syncMethodsForContract({
		graphqlService, methodProgressRepository, dataService, backfillProgressRepository
	}: { graphqlService: GraphqlService; dataService: DataService; methodProgressRepository: MethodProgressRepository; backfillProgressRepository?: BackfillProgressRepository },
		method: Method,
		contract: Contract,
	): Promise<void> {
		const startingBlock = contract.startingBlock;
		const { blockNumber } = await graphqlService.getLastBlock();
		const maxPage = Math.ceil((blockNumber - startingBlock) / LIMIT) || 1;

		for (let page = 1; page <= maxPage; page++) {
			await to(DataService._syncMethodsForContractPage(
				{
					graphqlService,
					methodProgressRepository,
					dataService
				},
				method,
				contract,
				startingBlock,
				blockNumber,
				page,
			));

			if (backfillProgressRepository) {
				const max = Math.min(blockNumber, page * LIMIT + startingBlock); // max block for current page
				const start = startingBlock + (page -1) * LIMIT; // start block for current page

				const currentProgress = await backfillProgressRepository.getProgress(contract.contractId);
				await backfillProgressRepository.updateProgress(contract.contractId, currentProgress + (max - start));
			}
		}
	}

	private static async _syncMethodsForContractPage({
			graphqlService, methodProgressRepository, dataService
		}: { graphqlService: GraphqlService; dataService: DataService; methodProgressRepository: MethodProgressRepository },
		method: Method,
		contract: Contract,
		startingBlock: number,
		maxBlock: number,
		page: number,
		limit: number = LIMIT,
	): Promise<number[]> {
		const progresses = await methodProgressRepository.findSyncedBlocks(contract.contractId, method.methodId, (page - 1) * limit, limit);

		const max = Math.min(maxBlock, page * limit + startingBlock); // max block for current page
		const start = startingBlock + (page -1) * limit; // start block for current page

		const allBlocks = Array.from({ length: max - start + 1 }, (_, i) => i + start);
		const syncedBlocks = progresses.map((p) => p.blockNumber);
		const notSyncedBlocks = allBlocks.filter(x => !syncedBlocks.includes(x));

		for (const blockNumber of notSyncedBlocks) {
			const header = await graphqlService.ethHeaderCidByBlockNumberWithTxHash(blockNumber);
			if (!header) {
				console.warn(`No header for ${blockNumber} block`);
				continue;
			}

			for (const ethHeader of header?.ethHeaderCidByBlockNumber?.nodes) {
				for (const tx of ethHeader.ethTransactionCidsByHeaderId.nodes) {
					if (!tx.txHash) {
						continue;
					}

					const graphTransaction = await graphqlService.graphTransactionByTxHash(tx.txHash);
					if (!graphTransaction?.graphTransactionByTxHash) {
						continue;
					}
					for (const graphCall of graphTransaction?.graphTransactionByTxHash?.graphCallsByTransactionId?.nodes) {
						const result = await DecodeService.decodeGraphCall(
							graphCall,
							() => Store.getStore().getContracts(),
							() => Store.getStore().getMethods(),
						);

						await dataService.processMethod(result.relatedNode, result.decoded);
					}
				}
			}

			await methodProgressRepository.add(contract.contractId, method.methodId, blockNumber);
		}

		return notSyncedBlocks;
	}

	public async prepareAddresses(contracts: Contract[] = []): Promise<void> {
		if (!env.ENABLE_HEADER_WATCHER && !env.ENABLE_STORAGE_WATCHER) {
			return;
		}

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

	private static _getTableOptions(contract: Contract, { event, method }: { event?: Event; method?: Method }): TableOptions {
		if (!event && !method) {
			throw new ApplicationError('Bad params');
		} else if (event && method) {
			throw new ApplicationError('Bad params');
		}

		let id: number;
		let type: string;
		if (event) {
			type = 'event';
			id = event.eventId;
		} else if (method) {
			type = 'method';
			id = method.methodId;
		}

		const tableName = this._getTableName({
			contractId: contract.contractId,
			type,
			id,
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
				},
			]
		};

		if (type === 'event') {
			tableOptions.columns = tableOptions.columns.concat([{
				name: 'contract_id',
				type: 'integer',
			}, {
				name: 'mh_key',
				type: 'text',
			}, {
				name: 'event_id',
				type: 'integer',
			}, {
				name: 'header_id',
				type: 'integer',
				isNullable: false,
			},]);

			tableOptions.foreignKeys = [{
				name: tableName,
				columnNames: ['header_id'],
				referencedTableName: 'eth.header_cids',
				referencedColumnNames: ['id'],
			}];

			const data: ABIInput[] = (contract.abi as ABI)?.find((e) => e.name === event.name)?.inputs;
			data.forEach((line) => {
				tableOptions.columns.push({
					name: `data_${line.name.toLowerCase().trim()}`,
					type: this._getPgType(line.internalType || line.type),
					isNullable: true,
				});
			});
		} else if (type === 'method') {
			tableOptions.columns = tableOptions.columns.concat([{
				name: 'dst',
				type: 'character varying(66)',
			}, {
				name: 'src',
				type: 'character varying(66)',
			}, {
				name: 'input',
				type: 'text', // TODO: bytea ?
			}, {
				name: 'output',
				type: 'text', // TODO: bytea ?
			}, {
				name: 'gas_used',
				type: 'numeric',
			}, {
				name: 'value',
				type: 'numeric'
			}, {
				name: 'opcode',
				type: 'text',
			}])
		}

		return tableOptions;
	}

	private async _createEventTable(contract: Contract, event: Event): Promise<void> {
		const tableName = DataService._getTableName({
			contractId: contract.contractId,
			type: 'event',
			id: event.eventId
		});
		const table = await getConnection().createQueryRunner().getTable(tableName);

		if (table) {
			console.log(`Table ${tableName} already exists`);
			return;
		}

		const tableOptions = DataService._getTableOptions(contract, { event });
		await getConnection().createQueryRunner().createTable(new Table(tableOptions), true);
		console.log('create new table', tableName);
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

	private async _createMethodTable(contract: Contract, method: Method): Promise<void> {
		const tableName = DataService._getTableName({
			contractId: contract.contractId,
			type: 'method',
			id: method.methodId,
		});
		const table = await getConnection().createQueryRunner().getTable(tableName);

		if (table) {
			console.log(`Table ${tableName} already exists`);
			return;
		}

		const tableOptions = DataService._getTableOptions(contract, { method });
		await getConnection().createQueryRunner().createTable(new Table(tableOptions), true);
		console.log('create new table', tableName);
	}

	public static _getKeyForFixedType(slot: number): string {
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
