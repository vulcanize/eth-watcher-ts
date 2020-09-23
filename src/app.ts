import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import Routes from './routes';
import Apollo from './apollo';

class App {

	public app: express.Application;
	public apolloClient: Apollo;
	public routePrv: Routes = new Routes();

	public constructor () {
		this.app = express();
		this.config();
		this.routePrv.routes(this.app);

		this.apolloClient = new Apollo();
		this.testApollo();

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

	private testApollo(): void{
		this.apolloClient.subscribe(
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
						}
						}
					}
				}
			`,
			(data) => console.log(data),
		);
	}
}

export default new App().app;
