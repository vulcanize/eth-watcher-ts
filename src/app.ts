import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';

import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import Routes from './routes';
import GraphqlClient from './graphqlClient';
import DataService from './services/dataService';

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
							ethTransactionCidByTxId {
								ethHeaderCidByHeaderId {
									blockNumber
								}
							}
						}
						}
					}
				}
			`,
			async (data) => dataService.processEvent(data?.data?.listen?.relatedNode),
		);
	}
}
