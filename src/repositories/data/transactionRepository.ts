import {EntityRepository, Repository} from 'typeorm';
import Transaction from '../../models/data/transaction';

@EntityRepository(Transaction)
export default class TransactionRepository extends Repository<Transaction> {

	public async add(id: number, {
		cid,
		deployment,
		headerId,
		index,
		mhKey,
		nodeId,
		dst,
		src,
		txData,
		txHash,
	}): Promise<Transaction> {
		return this.create({
			id,
			cid,
			deployment,
			headerId,
			index,
			mhKey,
			nodeId,
			dst,
			src,
			txData,
			txHash,
		});
	}

}
