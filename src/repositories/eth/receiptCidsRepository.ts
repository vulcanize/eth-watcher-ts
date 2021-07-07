import { DeepPartial, EntityRepository, Repository } from 'typeorm';
import ReceiptCids from '../../models/eth/receiptCids';
import TransactionCids from '../../models/eth/transactionCids';
import {DerivedReceipt, EthReceiptCid} from "../../types";

@EntityRepository(ReceiptCids)
export default class ReceiptCidsRepository extends Repository<ReceiptCids> {

	public async add(receipt: EthReceiptCid, additionalFields: DerivedReceipt, tx: TransactionCids): Promise<ReceiptCids> {
		const result = await this.createQueryBuilder()
			.insert()
			.values({
				txId: tx.id,
				cid: receipt.cid,
				mhKey: receipt.mhKey,
				contract: receipt.contract,
				topic0s: receipt.topic0S,
				topic1s: receipt.topic1S,
				topic2s: receipt.topic2S,
				topic3s: receipt.topic3S,
				logContracts: receipt.logContracts,
				postState: receipt.postState,
				postStatus: receipt.postStatus,
				gasUsed: additionalFields.gasUsed.toString()
			})
			.returning("*")
			// eslint-disable-next-line @typescript-eslint/camelcase
			.orUpdate({conflict_target: ["tx_id"], overwrite: ["cid", "mh_key", "contract", "topic0s", "topic1s", "topic2s", "topic3s", "log_contracts", "post_state", "post_status"]})
			.execute();

		return this.create(result.generatedMaps[0] as DeepPartial<ReceiptCids>)
	}

}
