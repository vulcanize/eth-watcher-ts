import * as abi from 'ethereumjs-abi';
import { keccak256, keccakFromHexString, rlp, BN } from 'ethereumjs-util';
import Event from '../models/contract/event';
import Contract from '../models/contract/contract';

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
}
