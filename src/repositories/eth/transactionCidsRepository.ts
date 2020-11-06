import {EntityRepository, Repository} from 'typeorm';
import TransactionCids from '../../models/eth/transactionCids';

@EntityRepository(TransactionCids)
export default class TransactionCidsRepository extends Repository<TransactionCids> {

	public async add(headerId: number, {
		cid,
		deployment,
		index,
		mhKey,
		dst,
		src,
		txData,
		txHash,
	}): Promise<TransactionCids> {
		return this.save({
			cid,
			deployment,
			headerId,
			index,
			mhKey,
			dst,
			src,
			txData,
			txHash,
		});
	}

}
