import * as dotenv from 'dotenv';
dotenv.config();

import { EthWatcherServer } from './server';
import DataService from './services/dataService';
import HeaderCids from "./models/eth/headerCids";

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// TODO: send to log system
});


(async (): Promise<void> => {
	const dataService = new DataService();

	await EthWatcherServer({ // DI
		processState: (data) => {
			if (!data) {
				return;
			}
			dataService.processState(data.relatedNode)
		},
		processHeader: async (data) => {
			const header: HeaderCids = await dataService.processHeader(data);
			if (data?.uncleCidsByHeaderId?.nodes && data?.uncleCidsByHeaderId?.nodes.length > 0) {
				for (const uncle of data?.uncleCidsByHeaderId?.nodes) {
					await dataService.processUncle(uncle, header.id);
				}
			}
			if (data?.ethTransactionCidsByHeaderId?.nodes && data?.ethTransactionCidsByHeaderId?.nodes.length > 0) {
				const txs = data.ethTransactionCidsByHeaderId.nodes;
				const receiptFields = dataService.deriveReceiptFields(txs);
				if (txs.length != receiptFields.length) {
					console.warn("transaction and receipt count mismatch");

					return;
				}
				for (const [index, tx] of txs.entries()) {
					const txCid = await dataService.processTransaction(tx, header.id);

					const receipt = tx.receiptCidByTxId;
					const additionalFields = receiptFields[index];
					await dataService.processReceipt(receipt, txCid, additionalFields);
				}
			}
		},
		processEvent: (data) => {
			if (!data) {
				return;
			}

			dataService.processEvent(null, data.relatedNode, data.decoded, data.event);
		},
	})
})();
