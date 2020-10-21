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
}
