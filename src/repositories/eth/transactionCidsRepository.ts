import {DeepPartial, EntityRepository, Repository} from 'typeorm';
import TransactionCids from '../../models/eth/transactionCids';
import {EthTransactionCid} from "../../types";

@EntityRepository(TransactionCids)
export default class TransactionCidsRepository extends Repository<TransactionCids> {

	public async add(headerId: number, tx: EthTransactionCid): Promise<TransactionCids> {
		const {cid, index, mhKey, dst, src, txData, txHash} = tx;

		const result = await this.createQueryBuilder()
			.insert()
			.values({
				cid,
				headerId,
				index,
				mhKey,
				dst,
				src,
				txData,
				txHash,
			})
			.returning("*")
			// eslint-disable-next-line @typescript-eslint/camelcase
			.orUpdate({conflict_target: ["header_id", "tx_hash"], overwrite: ["index", "cid", "mh_key", "dst", "src", "tx_data"]})
			.execute();

		return this.create(result.generatedMaps[0] as DeepPartial<TransactionCids>)
	}

}
