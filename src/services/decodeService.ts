import * as abi from 'ethereumjs-abi';
import { keccak256, keccakFromHexString, rlp } from 'ethereumjs-util';
import Event from '../models/contract/event';
import Contract from '../models/contract/contract';
import State from '../models/contract/state';
import { toStructure } from './dataTypeParser';
import {
	ABI,
	ABIInputData,
	ContractFunction,
	DecodeReceiptResult,
	DecodeStateResult,
	EventFunction,
	EthReceiptCid,
	StateFunction,
	EthStateCid,
} from "../types";
import {getContractsFromLogs} from "../utils";

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

	public static async decodeReceiptCid(relatedNode: EthReceiptCid, contracts: Contract[] | ContractFunction, events: Event[] | EventFunction): Promise<DecodeReceiptResult> {
		if (!relatedNode || !relatedNode.logContracts || !relatedNode.logContracts.length) {
			return;
		}

		if (typeof contracts === 'function') {
			contracts = contracts();
		}

		if (typeof events === 'function') {
			events = events();
		}

		const targetContracts = getContractsFromLogs(contracts, relatedNode.logContracts);
		if (!targetContracts.length) {
			return;
		}
		// @TODO process all contracts
		const targetContract = targetContracts[0];

		const targetEvents = (events as Event[]).filter((event) => targetContract.events.includes(event.eventId));
		if (!targetContract || !targetEvents || targetEvents.length === 0) {
			return;
		}

		const meta = {} as any; // eslint-disable-line
		for (const e of targetEvents) {
			const contractAbi = (targetContract.abi as ABI).concat(...targetContract.allAbis);
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
					const buffer = Buffer.from(relatedNode.blockByMhKey.data.replace('\\x', ''), 'hex');
					const decoded: any = rlp.decode(buffer); // eslint-disable-line

					// console.log(decoded[0].toString('hex'));
					// console.log(decoded[1].toString('hex'));
					// console.log(decoded[2].toString('hex'));

					const addressFromBlock = decoded[3][index][0].toString('hex');
					console.log('address', addressFromBlock);

					const hashFromBlock = decoded[3][index][1][0].toString('hex');
					console.log(hashFromBlock);

					meta.event = event.name;
					meta.blockHash = hashFromBlock;
					meta.keccak256 = hash;
					meta.payload = payload;

					const notIndexedEvents = event.inputs.filter(input => !input.indexed);
					const indexedEvents = event.inputs.filter(input => input.indexed);

					const messages = abi.rawDecode(notIndexedEvents.map(input => input.internalType), decoded[3][index][2]);

					const array: ABIInputData[] = [];
					indexedEvents.forEach((input, index) => {
						const topic = relatedNode[`topic${index + 1}S`][0].replace('0x', '');

						try {
							array.push({
								name: input.name,
								value: abi.rawDecode([input.internalType], Buffer.from(topic, 'hex'))[0],
							});
						} catch (e) {
							console.log('Error abi decode', input.name, input.internalType, e.message);
						}
					});

					notIndexedEvents.forEach((input, index) => {
						array.push({
							name: input.name,
							value: messages[index],
						});
					});

					console.log('array', array);

					return {
						meta,
						relatedNode,
						decoded: array,
						event
					};
				}
			}
		}

		return {
			meta,
			relatedNode,
			decoded: null,
			event: null,
		};
	}

	public static async decodeStateCid(relatedNode: EthStateCid, contracts: Contract[] | ContractFunction, states: State[] | StateFunction): Promise<DecodeStateResult>{
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

			const array: { name: string; value: string | number }[] = [];
			const meta = {} as any; // eslint-disable-line

			if (relatedNode?.storageCidsByStateId?.nodes?.length) {
				for (const state of targetStates) {
					const structure = toStructure(state.type, state.variable);

					console.log('structure', structure);

					meta.contractAddress = targetContract.address;
					meta.slot = state.slot;
					meta.type = state.type;
					meta.variable = state.variable;

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
				meta,
			};
	}
}
