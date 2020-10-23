import {EntityRepository, Repository} from 'typeorm';
import Header from '../../models/data/header';

@EntityRepository(Header)
export default class HeaderRepository extends Repository<Header> {

	public async add(id: number, {
		td,
		blockHash,
		blockNumber,
		bloom,
		cid,
		mhKey,
		nodeId,
		ethNodeId,
		parentHash,
		receiptRoot,
		uncleRoot,
		stateRoot,
		txRoot,
		reward,
		timesValidated,
		timestamp,
	}): Promise<Header> {
		return this.save({
			id,
			td,
			blockHash,
			blockNumber,
			bloom,
			cid,
			mhKey,
			nodeId,
			ethNodeId,
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

	public async findSyncedHeaders(offset = 0, limit = 1000): Promise<Header[]> {
		const query = this.createQueryBuilder('header')
			.orderBy({
				'header.id': 'ASC',
			})
			.take(limit)
			.offset(offset);

		return query.getMany();
	}


	public async getMaxHeaderId(): Promise<number> {
		const query = this.createQueryBuilder('header')
			.select("MAX(header.id)", "max");

		const result = await query.getRawOne();

		return result?.max || 0;
	}

}
