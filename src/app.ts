import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as abi from 'ethereumjs-abi';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import { keccak256, rlp } from 'ethereumjs-util'
import Routes from './routes';
import GraphqlClient from './graphqlClient';
import Store from './store';
import DataService from './services/dataService';
import Event from './models/contract/event';


export default class App {

	public app: express.Application;
	public graphqlClient: GraphqlClient;
	public routePrv: Routes = new Routes();

	public constructor () {
		this.app = express();
		this.config();
		this.routePrv.routes(this.app);

		this.graphqlClient = new GraphqlClient();

		// Error handler
		this.app.use((error, req, res, next) => {
			if (!error) {
				return next();
			}

			// TODO: send error
			console.log(error);

			res.status(error.httpStatusCode || INTERNAL_SERVER_ERROR).json({
				error: error.message || error
			});
		});

		// 404 page
		this.app.use((_, res) => {
			res.status(NOT_FOUND).json({
				error: 'Not found'
			});
		});
	}

	private config(): void{
		this.app.disable('x-powered-by');
		this.app.use(cors());
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: false }));
	}

	public async subscribeToGraphql(): Promise<void>{
		console.log('Subscribe to GraphQL');

		const dataService = new DataService();

		Store.getStore(); // TODO: remove

		this.graphqlClient.subscribe(
			`
				subscription MySubscription {
					listen(topic: "receipt_cids") {
						relatedNode {
						... on ReceiptCid {
							id
							mhKey
							logContracts
							nodeId
							topic0S
							topic1S
							topic2S
							topic3S
							txId
							cid
							contract
							blockByMhKey {
								data
							}
						}
						}
					}
				}
			`,
			async (data) => {
				const relatedNode = data?.data?.listen?.relatedNode;
				
				if (!relatedNode || !relatedNode.logContracts || !relatedNode.logContracts.length) {
					return;
				}

				const target = Store.getStore().getContracts().find((contract) => contract.address === relatedNode.logContracts[0]);
				if (!target) {
					return;
				}

				console.log('Target contract', target);

				const events: Event[] = Store.getStore().getEvents();
				for (const e of events) {
					const contractAbi = target.abi as Array<{ name: string; type: string; inputs: { name; type; indexed; internalType }[] }>;
					const event = contractAbi.find((a) => a.name = e.name);
					if (!event) {
						return;
					}

					const payload = `${event.name}(${event.inputs.map(input => input.internalType).join(',')})`;

					console.log(event.inputs);
					console.log('payload', payload);

					const hash = '0x' + keccak256(Buffer.from(payload)).toString('hex');
					console.log('hash', hash);
					console.log('topic0S', relatedNode.topic0S[0])

					if (relatedNode.topic0S && relatedNode.topic0S.length && relatedNode.topic0S[0] === hash) {
						console.log('Bingo!');

						if (relatedNode.blockByMhKey && relatedNode.blockByMhKey.data) {
							const buffer = Buffer.from(relatedNode.blockByMhKey.data.replace('\\x',''), 'hex');
							const decoded: any = rlp.decode(buffer); // eslint-disable-line

							// console.log(decoded[0].toString('hex'));
							// console.log(decoded[1].toString('hex'));
							// console.log(decoded[2].toString('hex'));

							const addressFromBlock = decoded[3][0][0].toString('hex');
							console.log('address', addressFromBlock);

							const hashFromBlock = decoded[3][0][1][0].toString('hex');
							console.log(hashFromBlock);

							const messages = abi.rawDecode(event.inputs.map(input => input.internalType), decoded[3][0][2])
							console.log(messages);

							const indexedEvents = event.inputs.filter(input => input.indexed);
							console.log('indexedEvents', indexedEvents);

							const topic0S = abi.rawDecode([ 'uint32' ], Buffer.from(relatedNode.topic0S[0], 'hex'));
							console.log('topic0S', topic0S);

							const json = {
								topic0S,
								messages,
								indexedEvents,
							}

							const newEvent = await dataService.addEvent(e.eventId ,target.contractId, json, relatedNode.mhKey);
							console.log(newEvent);
						}
					}
				}
			},
		);
	}
}
