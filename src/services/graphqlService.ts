import Store from '../store';
import GraphqlClient from '../graphqlClient';
import GraphqlRepository from '../repositories/graphqlRepository';
import { keccak256, rlp } from 'ethereumjs-util';
import * as abi from 'ethereumjs-abi';
import { toStructure } from './dataTypeParser';
// import DataService from './dataService';

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

	public async subscriptionReceiptCids(store: Store, func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionReceiptCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;

			console.log(relatedNode);
			if (!relatedNode || !relatedNode.logContracts || !relatedNode.logContracts.length) {
				return;
			}

			const target = store.getContracts().find((contract) => contract.address === relatedNode.logContracts[0]);
			console.log('target', target);
			if (!target || !target.events) {
				return;
			}

			const targetEvents = store.getEventsByContractId(target.contractId);
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

						return func({ relatedNode, decoded: array });
					}
				}
			}

			return func({ relatedNode });
		});
	}

	public async subscriptionHeaderCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionHeaderCids(func);
	}


	// [{
    //       slot: 0,
    //       type: 'string public message = "hello world";',
    //       variable: 'message'
	// 	}]

	public async subscriptionStateCids(store: Store, func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionStateCids(async (data) => {
			const relatedNode = data?.data?.listen?.relatedNode;

			if (!relatedNode || !relatedNode.stateLeafKey) {
				return;
			}

			console.log(JSON.stringify(relatedNode, null, 2));

			const array = [];

			const contract = store.getContractByAddressHash(relatedNode.stateLeafKey);
			if (contract && relatedNode?.storageCidsByStateId?.nodes?.length) {
				const contractAddress = store.getAddress(contract.address);
				const states = store.getStatesByContractId(contract.contractId);

				for (const state of states) {
					const structure = toStructure(state.type, state.variable);

					console.log('structure', structure);

					// if (structure.type === 'mapping') {
					// 	if (structure.value.type === 'simple') {
					// 		for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
					// 			console.log('storage.storageLeafKey', contractAddress.addressId, state.stateId, storage.storageLeafKey);

					// 			if (!storage.storageLeafKey) {
					// 				continue;
					// 			}

					// 			const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
					// 			const decoded: any = rlp.decode(buffer); // eslint-disable-line
					// 			const value = abi.rawDecode([ structure.value.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

					// 			console.log(decoded);
					// 			console.log(rlp.decode(Buffer.from(decoded[1], 'hex')));

					// 			console.log(decoded[0].toString('hex'));
					// 			console.log(value);

					// 			array.push({
					// 				name: structure.value.name,
					// 				value,
					// 			});
					// 		}
					// 	} else if (structure.value.type === 'struct') {
					// 		// asd mmaping -> struct
					// 		console.log('structure.value', structure.value.fields);

					// 		let storageLeafKey;
					// 		let addressId;
					// 		for (const storage of relatedNode?.storageCidsByStateId?.nodes) {
					// 			addressId = await store.getAddressIdByHash(contractAddress.addressId, state.stateId, storage.storageLeafKey);

					// 			if (!addressId) {
					// 				continue;
					// 			}

					// 			storageLeafKey = storage.storageLeafKey;
					// 		}

					// 		const address = store.getAddressById(addressId);

					// 		const hashes = [storageLeafKey];
					// 		const correctStorageLeafKey = DataService._getKeyForMapping(address.address, state.slot, false);
					// 		for (let i = 1; i < structure.value.fields.length; i++) {
					// 			const x = new BigNumber(correctStorageLeafKey);
					// 			const sum = x.plus(i);
					// 			const key = '0x' + sum.toString(16);
					// 			hashes.push('0x' + keccakFromHexString(key).toString('hex'));
					// 		}

					// 		let index = state.slot;
					// 		const data: { name: string; value: any }[] = []; // eslint-disable-line
					// 		for (const field of structure.value.fields) {
					// 			if (field.type === 'simple') {
					// 				const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === hashes[index]);
					// 				console.log('storageLeafKey', hashes[index]);
					// 				index++;

					// 				if (!storage) {
					// 					continue;
					// 				}

					// 				const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
					// 				const decoded: any = rlp.decode(buffer); // eslint-disable-line

					// 				console.log(decoded);
					// 				const value = abi.rawDecode([ field.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

					// 				data.push({
					// 					name: field.name,
					// 					value,
					// 				});
					// 			} else {
					// 				// TODO:
					// 			}
					// 		}

					// 		console.log('data', data);
					// 		await slotRepository.add(tableOptions[1].name,
					// 			[`${structure.name}_id`, ...data.map((d) => d.name)],
					// 			[id, ...data.map((d) => d.value)]
					// 		);
					// 	} else {
					// 		// TODO
					// 	}
					// } else if (structure.type === 'struct') {
					// 	const slotRepository: SlotRepository = new SlotRepository(getConnection().createQueryRunner());

					// 	let index = state.slot;
					// 	const data: { name: string; value: any }[] = []; // eslint-disable-line
					// 	for (const field of structure.fields) {
					// 		if (field.type === 'simple') {
					// 			const storageLeafKey = DataService._getKeyForFixedType(index);
					// 			console.log('storageLeafKey', storageLeafKey);
					// 			index++;

					// 			const storage = relatedNode?.storageCidsByStateId?.nodes.find((s) => s.storageLeafKey === storageLeafKey);
					// 			if (!storage) {
					// 				continue;
					// 			}

					// 			const buffer = Buffer.from(storage.blockByMhKey.data.replace('\\x',''), 'hex');
					// 			const decoded: any = rlp.decode(buffer); // eslint-disable-line

					// 			console.log(decoded);
					// 			const value = abi.rawDecode([ field.kind ], rlp.decode(Buffer.from(decoded[1], 'hex')))[0];

					// 			data.push({
					// 				name: field.name,
					// 				value,
					// 			});
					// 		} else {
					// 			// TODO
					// 		}
					// 	}

					// 	await slotRepository.add(tableOptions[0].name, data.map((d) => d.name), data.map((d) => d.value));
					// } else if (structure.type === 'simple') {
					if (structure.type === 'simple') {
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
							address: decoded[0].toString('hex'),
							value: value.toString(),
						});
					}
				}
			}

			return func({ relatedNode, decoded: array });
		});
	}

}
