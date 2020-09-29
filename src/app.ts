import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import Routes from './routes';
import GraphqlClient from './graphqlClient';
import ContractService from './services/contractService';
import { keccak256 } from 'ethereumjs-util'

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

		const contractService = new ContractService();
		const contracts = await contractService.loadContracts();

		console.log(`Loaded ${contracts.length} contracts config`);

		this.graphqlClient.subscribe(
			`
				subscription MySubscription {
					listen(topic: "receipt_cids") {
						relatedNodeId
						relatedNode {
						nodeId
						... on ReceiptCid {
							id
							contract
							contractHash
							logContracts
							topic0S
							topic1S
							topic2S
							topic3S
							txId
							mhKey
						}
						}
					}
				}
			`,
			(data) => {
				const relatedNode = data?.data?.listen?.relatedNode;
				if (!relatedNode || !relatedNode.logContracts || !relatedNode.logContracts.length) {
					return;
				}

				const target = contracts.find((contract) => contract.address === relatedNode.logContracts[0]);
				if (!target) {
					return;
				}

				console.log('Target contract', target);

				const event = (target.abi as Array<{ name: string; type: string; inputs: { type }[] } >).find((a) => a.name = 'MessageChanged');
				if (!event) {
					return;
				}

				const payload = `${event.name}(${event.inputs.map(input => input.type).join(',')})`;

				console.log('payload', payload);

				const hash = '0x' + keccak256(Buffer.from(payload)).toString('hex');
				console.log('hash', hash);
				console.log('topic0S', relatedNode.topic0S[0])

				if (relatedNode.topic0S && relatedNode.topic0S.length && relatedNode.topic0S[0] === hash) {
					console.log('Bingo!');
				}
			},
		);
	}
}
