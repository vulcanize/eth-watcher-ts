import GraphqlClient from '../graphqlClient';
import GraphqlRepository from '../repositories/graphqlRepository';
import { keccak256, keccakFromHexString, rlp } from 'ethereumjs-util';
import * as abi from 'ethereumjs-abi';
import { toStructure } from './dataTypeParser';
import State from '../models/contract/state';
import Contract from '../models/contract/contract';
import Event from '../models/contract/event';
import DecodeService from '../services/decodeService';

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

export default class GraphqlService {
	private graphqlRepository: GraphqlRepository;

	constructor (graphqlClient: GraphqlClient) {
		this.graphqlRepository = GraphqlRepository.getRepository(graphqlClient);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidWithTransactionByBlockNumber(blockNumber: string | number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidWithTransactionByBlockNumber(blockNumber);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidWithStateByBlockNumber(blockNumber: string | number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidWithStateByBlockNumber(blockNumber);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async ethHeaderCidById(headerId: number): Promise<any> {
		return this.graphqlRepository.ethHeaderCidById(headerId);
	}

	public async subscriptionReceiptCids(contracts: Contract[] | Function, events: Event[] | Function, func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionReceiptCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;
			console.log(relatedNode);

			const result = await DecodeService.decodeReceiptCid(relatedNode, contracts, events);
			return func(result);
		});
	}

	public async subscriptionHeaderCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionHeaderCids(func);
	}

	public async subscriptionStateCids(contract: Contract, states: State[], func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionStateCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;

			if (!relatedNode || !relatedNode.stateLeafKey) {
				return;
			}

			const stateLeafKey = '0x' + keccakFromHexString(contract.address).toString('hex');
			if (relatedNode.stateLeafKey !== stateLeafKey) {
				return;
			}

			console.log(JSON.stringify(relatedNode, null, 2));

			const array: { name: string; value: any }[] = [];

			if (relatedNode?.storageCidsByStateId?.nodes?.length) {
				for (const state of states) {
					const structure = toStructure(state.type, state.variable);

					console.log('structure', structure);

					if (structure.type === 'mapping') {
						if (structure.value.type === 'simple') {
							for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
								if (!storage.storageLeafKey) {
									continue;
								}

								const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
								const decoded: any = rlp.decode(buffer); // eslint-disable-line
								const value = abi.rawDecode([ structure.value.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

								array.push({
									name: structure.value.name,
									value,
								});
							}
						} else if (structure.value.type === 'struct') {
							// let storageLeafKey;
							// let addressId;
							// for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
							// 	addressId = await store.getAddressIdByHash(contractAddress.addressId, state.stateId, storage.storageLeafKey);

							// 	if (!addressId) {
							// 		continue;
							// 	}

							// 	storageLeafKey = storage.storageLeafKey;
							// }

							// const address = store.getAddressById(addressId);

							// const hashes = [storageLeafKey];
							// const correctStorageLeafKey = DataService._getKeyForMapping(address.address, state.slot, false);
							// for (let i = 1; i < structure.value.fields.length; i++) {
							// 	const x = new BigNumber(correctStorageLeafKey);
							// 	const sum = x.plus(i);
							// 	const key = '0x' + sum.toString(16);
							// 	hashes.push('0x' + keccakFromHexString(key).toString('hex'));
							// }

							// let index = state.slot;
							// const data: { name: string; value: any }[] = []; // eslint-disable-line
							// for (const field of structure.value.fields) {
							// 	if (field.type === 'simple') {
							// 		const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === hashes[index]);
							// 		console.log('storageLeafKey', hashes[index]);
							// 		index++;

							// 		if (!storage) {
							// 			continue;
							// 		}

							// 		const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
							// 		const decoded: any = rlp.decode(buffer); // eslint-disable-line

							// 		console.log(decoded);
							// 		const value = abi.rawDecode([ field.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

							// 		data.push({
							// 			name: field.name,
							// 			value,
							// 		});
							// 	} else {
							// 		// TODO:
							// 	}
							// }

							// console.log('data', data);
							// await slotRepository.add(tableOptions[1].name,
							// 	[`${structure.name}_id`, ...data.map((d) => d.name)],
							// 	[id, ...data.map((d) => d.value)]
							// );
						} else {
							// TODO
						}
					} else if (structure.type === 'struct') {
						let index = state.slot;
						for (const field of structure.fields) {
							if (field.type === 'simple') {
								const storageLeafKey = '0x' + keccak256(Buffer.from(INDEX[index], 'hex')).toString('hex');
								index++;

								const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === storageLeafKey);
								if (!storage) {
									continue;
								}

								const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
								const decoded: any = rlp.decode(buffer); // eslint-disable-line

								const value = abi.rawDecode([ field.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

								array.push({
									name: field.name,
									value,
								});
							} else {
								// TODO
							}
						}
					} else if (structure.type === 'simple') {
						const storageLeafKey = '0x' + keccak256(Buffer.from(INDEX[state.slot], 'hex')).toString('hex');
						console.log('storageLeafKey', storageLeafKey);

						const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === storageLeafKey);
						console.log('storage', storage);
						if (!storage) {
							continue;
						}

						const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
						console.log(buffer);
						const decoded: any = rlp.decode(buffer); // eslint-disable-line
						console.log(decoded);
						const value = abi.rawDecode([ structure.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];
						console.log(value);

						array.push({
							name: structure.name,
							value: value.toString(),
						});
					}
				}
			}

			return func({ relatedNode, decoded: array });
		});
	}

}
