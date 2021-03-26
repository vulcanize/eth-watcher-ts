
import to from 'await-to-js';
import { getConnection, Table } from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import * as abi from 'ethereumjs-abi';
import {keccak256, keccakFromHexString, rlp, BN, toAscii, toUtf8} from 'ethereumjs-util';
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
import {
	ABI,
	ABIElem,
	ABIInput,
	EthHeaderCid,
	EthReceiptCid,
	EthStateCid,
	EthStorageCid,
	EthTransactionCid
} from "../types";
import BackfillProgressRepository from '../repositories/data/backfillProgressRepository';
import BlockRepository from "../repositories/eth/blockRepository";
import {decodeStorageCid, increaseHexByOne} from "../utils";

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

	public async addEvent (eventId: number, contractId: number, headerId: number, data: ABIInputData[], mhKey: string): Promise<void> {
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
		});
	}

	public async addState (contractId: number, mhKey: string, state: State, value: string | number, fieldName: string): Promise<void> {
		const tableName = DataService._getTableName({
			contractId,
			type: 'state',
			id: state.stateId,
		});

		return getConnection().transaction(async (entityManager) => {
			const sql = `INSERT INTO ${tableName}
(state_id, contract_id, mh_key, ${fieldName})
VALUES
(${state.stateId}, ${contractId}, '${mhKey}', '${value}');`;

			console.log(sql);

			const [err] = await to(entityManager.queryRunner.query(sql));
			if (err) {
				// TODO: throw err
				console.log(err);
			}
		});
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
			const blockRepository: BlockRepository = entityManager.getCustomRepository(BlockRepository);

			await blockRepository.add(ethTransaction.mhKey, ethTransaction.blockByMhKey.data); // eslint-disable-line
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
			const blockRepository: BlockRepository = entityManager.getCustomRepository(BlockRepository);

			await blockRepository.add(relatedNode.mhKey, relatedNode.blockByMhKey.data); // eslint-disable-line
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

		await this.processHeader(relatedNode?.ethHeaderCidByHeaderId);

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
							// at 0 index we have storage leaf key
							const storageData = decoded[1];
							const storageDataDecoded = rlp.decode(storageData);

							let value;
							if (structure.value.kind === 'string') {
								value = toAscii(storageDataDecoded.toString('hex'));
							} else {
								value = abi.rawDecode([ structure.value.kind ], storageDataDecoded)[0];
							}

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
						// asd mmaping -> struct
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
					// at 0 index we have storage leaf key
					const storageData = decoded[1];
					const storageDataDecoded = rlp.decode(storageData);

					let value;
					if (structure.kind === 'string') {
						const result = this.deriveStringFromStorage(state.slot, relatedNode?.storageCidsByStateId?.nodes);
						if (!result.success) {
							continue;
						}

						value = result.result;
					} else {
						value = abi.rawDecode([ structure.kind ], storageDataDecoded)[0];
					}

					console.log(decoded[0].toString('hex'));
					console.log(value);

					await this.addState(contract.contractId, storage.blockByMhKey.key, state, value, structure.name);
				}
			}
		}
	}

	public deriveStringFromStorage(slot: number, storages: EthStorageCid[]): {result: string; success: boolean} {
		// calculate keccak hash
		const storageLeafKey = DataService._getKeyForFixedType(slot);
		const storage = storages.find((s) => s.storageLeafKey === storageLeafKey);
		if (!storage) {
			return {
				result: "",
				success: false
			};
		}

		const data = decodeStorageCid(storage);
		const dataHex = data.toString('hex');
		// 32 bytes
		if (dataHex.length == 64) {
			/*
			 	data length is 31 bytes or less
			 	lowest-order byte stores length * 2
			 	example:
			 	61 62 63 31 32 33 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0c
			 	^  ^  ^  ^  ^  ^                                                                             ^
			 	hex encoded string                                                                        length * 2
			 */

			const len = parseInt(data.toString('hex', dataHex.length/2 - 2), 16);
			const value = toAscii(data.toString('hex', 0, len / 2));

			return {
				result: value,
				success: true,
			}
		} else {
			/*
			 result data string length more than 31 bytes. At address keccak(slot) stored `length * 2 + 1`
			 data itself stored at multiple addresses:
			 	* keccak(keccak(slot))
			 	* keccak(keccak(slot)+1)
			 	* keccak(keccak(slot)+2)
			 	* etc

			 */
			let len = parseInt(dataHex, 16);
			len -= 1;
			len /= 2;

			let result = '';
			let nextAddress = storageLeafKey;

			for (let i = 0; i < len/32; i++) {
				const hash = '0x' + keccakFromHexString(nextAddress).toString('hex');
				const storage = storages.find((s) => s.storageLeafKey === hash);
				if (!storage) {
					return {
						result: "",
						success: false
					};
				}

				const data = decodeStorageCid(storage);
				result += toUtf8(data.toString('hex'));

				nextAddress = increaseHexByOne(nextAddress);
			}

			return {
				result,
				success: true
			};
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
					await dataService.processState(result.relatedNode);
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
					}, {
						name: 'header_id',
						type: 'integer',
						isNullable: false,
					},
				],
				foreignKeys: [{
					name: tableName,
					columnNames: ['header_id'],
					referencedTableName: 'eth.header_cids',
					referencedColumnNames: ['id'],
				}],
			};

			tableOptions.columns.push({
				name: 'event_id',
				type: 'integer',
			});

			const data: ABIInput[] = (contract.abi as ABI)?.find((e) => e.name === event.name)?.inputs;
			data.forEach((line) => {
				tableOptions.columns.push({
					name: `data_${line.name.toLowerCase().trim()}`,
					type: this._getPgType(line.internalType || line.type),
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
				//console.log(`Table ${tableName} already exists`);
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
				//console.log(`Table ${tableName} already exists`);
				return;
			}

			const tableOptions = toTableOptions(tableName, toStructure(state.type, state.variable))
			await Promise.all(
				tableOptions.map((t) => entityManager.queryRunner.createTable(new Table(t), true))
			);
			console.log('create new table', tableName);
		});
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
