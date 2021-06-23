import {DeepPartial, EntityRepository, Repository} from 'typeorm';
import UncleCids from '../../models/eth/uncleCids';
import {EthUncleCid} from "../../types";

@EntityRepository(UncleCids)
export default class UncleCidsRepository extends Repository<UncleCids> {

	public async add(headerId: number, uncle: EthUncleCid): Promise<UncleCids> {
		const result = await this.createQueryBuilder()
			.insert()
			.values({
				headerId: headerId,
				blockHash: uncle.blockHash,
				parentHash: uncle.parentHash,
				cid: uncle.cid,
				mhKey: uncle.mhKey,
				reward: uncle.mhKey,
			})
			.returning("*")
			.execute();
		return this.create(result.generatedMaps[0] as DeepPartial<UncleCids>)
	}

}
