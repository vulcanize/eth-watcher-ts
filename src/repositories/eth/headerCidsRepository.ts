import {DeepPartial, EntityRepository, Repository} from 'typeorm';
import HeaderCids from '../../models/eth/headerCids';
import {EthHeaderCid} from "../../types";

@EntityRepository(HeaderCids)
export default class HeaderCidsRepository extends Repository<HeaderCids> {

	public async add(header: EthHeaderCid): Promise<HeaderCids> {
		const {td, blockHash, blockNumber, bloom, cid, mhKey, parentHash, receiptRoot, uncleRoot, stateRoot, txRoot,
			reward, timesValidated, timestamp} = header;
		const result = await this.createQueryBuilder()
			.insert()
			.values({
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
			})
			.returning("*")
			// eslint-disable-next-line @typescript-eslint/camelcase
			.orUpdate({conflict_target: ["block_number", "block_hash"], overwrite: ["parent_hash", "cid", "mh_key", "td", "node_id"]})
			.execute();

		return this.create(result.generatedMaps[0] as DeepPartial<HeaderCids>)
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

}
