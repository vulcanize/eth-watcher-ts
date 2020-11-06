import {EntityRepository, Repository} from 'typeorm';
import HeaderCids from '../../models/eth/headerCids';

@EntityRepository(HeaderCids)
export default class HeaderCidsRepository extends Repository<HeaderCids> {

	public async add({
		td,
		blockHash,
		blockNumber,
		bloom,
		cid,
		mhKey,
		nodeId,
		parentHash,
		receiptRoot,
		uncleRoot,
		stateRoot,
		txRoot,
		reward,
		timesValidated,
		timestamp,
	}): Promise<HeaderCids> {
		return this.save({
			td,
			blockHash,
			blockNumber,
			bloom,
			cid,
			mhKey,
			nodeId: 1, // TODO: fix it
			parentHash,
			receiptRoot,
			uncleRoot,
			stateRoot,
			txRoot,
			reward,
			timesValidated,
			timestamp,
		});
	}

	public async findSyncedHeaders(offset = 0, limit = 1000): Promise<HeaderCids[]> {
		const query = this.createQueryBuilder('header_cids')
			.orderBy({
				'header_cids.id': 'ASC',
			})
			.take(limit)
			.offset(offset);

		return query.getMany();
	}


	public async getMaxHeaderId(): Promise<number> {
		const query = this.createQueryBuilder('header_cids')
			.select("MAX(header_cids.id)", "max");

		const result = await query.getRawOne();

		return result?.max || 0;
	}

}
