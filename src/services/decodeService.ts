import * as abi from 'ethereumjs-abi';
import { keccak256, keccakFromHexString, rlp } from 'ethereumjs-util';
import Event from '../models/contract/event';
import Contract from '../models/contract/contract';
import State from '../models/contract/state';
import { toStructure } from './dataTypeParser';
import { ABI } from "../types/abi";
import Method from "../models/contract/method";

type ABIInputData = {
	name: string;
	value?: any; // eslint-disable-line
}

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

export default class DecodeService {

	public static async decodeReceiptCid(relatedNode, contracts: Contract[] | Function, events: Event[] | Function): Promise<{relatedNode; decoded}>{
		if (!relatedNode || !relatedNode.logContracts || !relatedNode.logContracts.length) {
			return;
		}

		if (typeof contracts === 'function') {
			contracts = contracts();
		}

		if (typeof events === 'function') {
			events = events();
		}

		const targetContract = (contracts as Contract[]).find((contract) => contract.address === relatedNode.logContracts[0]);
		if (!targetContract) {
			return;
		}

		const targetEvents = (events as Event[]).filter((event) => targetContract.events.includes(event.eventId));
		if (!targetContract || !targetEvents || targetEvents.length === 0) {
			return;
		}

		for (const e of targetEvents) {
			const contractAbi = targetContract.abi as ABI;
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

					console.log('array', array);

					return {
						relatedNode,
						decoded: array,
					};
				}
			}
		}

		return {
			relatedNode,
			decoded: null,
		};
	}

	public static async decodeStateCid(relatedNode, contracts: Contract[] | Function, states: State[] | Function): Promise<{relatedNode; decoded}>{
			if (!relatedNode || !relatedNode.stateLeafKey || !relatedNode?.storageCidsByStateId?.nodes?.length) {
				return;
			}

			if (typeof contracts === 'function') {
				contracts = contracts();
			}

			if (typeof states === 'function') {
				states = states();
			}

			const targetContract = (contracts as Contract[]).find((contract) => '0x' + keccakFromHexString(contract.address).toString('hex') === relatedNode.stateLeafKey);
			if (!targetContract) {
				return;
			}

			const targetStates = (states as State[]).filter((state) => targetContract.states.includes(state.stateId));

			console.log(JSON.stringify(relatedNode, null, 2));

			const array: { name: string; value: any }[] = [];

			if (relatedNode?.storageCidsByStateId?.nodes?.length) {
				for (const state of targetStates) {
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

			return {
				relatedNode,
				decoded: array,
			};
	}

	public static async decodeGraphCall(relatedNode, contracts: Contract[] | Function, methods: Method[] | Function): Promise<{relatedNode; decoded}>{
		console.log('relatedNode!', relatedNode);
		if (!relatedNode) {
			return;
		}

		if (typeof contracts === 'function') {
			contracts = contracts();
		}

		if (typeof methods === 'function') {
			methods = methods();
		}

		// {
		// 	__typename: 'GraphCall',
		// 	dst: '0xa2240F16952e84F791B14DA0182F49a7949ea1c8',
		// 	gasUsed: '100500',
		// 	input: '\\x45275c 5c7845453931394435303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303227',
		// 	output: '\\x30',
		// 	src: '0x117Db93426Ad44cE9774D239389fcB83057Fc88b',
		// 	value: '0',
		// 	opcode: '\\x31',
		// 	transactionId: 1
		// }

		let targetContract = (contracts as Contract[]).find((contract) => contract.address === relatedNode.dst || contract.address === relatedNode.src);
		if (!targetContract) {
			// TODO: remove this code
			targetContract = contracts[0];
			// return;
		}

		const targetMethods = (methods as Method[]).filter((method) => targetContract.methods.includes(method.methodId));

		if (!targetContract || !targetMethods || targetMethods.length === 0) {
			return;
		}

		for (const m of targetMethods) {
			const contractAbi = targetContract.abi as ABI;
			const method = contractAbi.find((a) => a.name === m.name.split('(')[0] );

			console.log('method!', method);

			if (!method) {
				continue;
			}

			const payload = `${method.name}(${method.inputs.map(input => input.type).join(',')})`;
			const hash = '0x' + keccak256(Buffer.from(payload)).toString('hex');

			console.log('payload', payload);
			console.log('hash', hash);

			// TODO: check first 6 charts

			// decode rlp
		}

		return {
			relatedNode,
			decoded: null,
		};
	}
}
