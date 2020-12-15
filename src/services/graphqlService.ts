import Store from '../store';
import GraphqlClient from '../graphqlClient';
import GraphqlRepository from '../repositories/graphqlRepository';
import Event from "../models/contract/event";
import { keccak256, rlp } from 'ethereumjs-util';
import * as abi from 'ethereumjs-abi';

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

			const targetEvents: Event[] = store.getEventsByContractId(target.contractId);
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

	public async subscriptionStateCids(func: (value: any) => void): Promise<void> {
		return this.graphqlRepository.subscriptionStateCids(func);
	}

}
