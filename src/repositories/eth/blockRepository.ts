import {DeepPartial, EntityRepository, Repository} from 'typeorm';
import Block from '../../models/eth/block';

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {

	public async add(key: string, data: string): Promise<Block> {

		const result = await this.createQueryBuilder()
			.insert()
			.values({
				key,
				data
			})
			.returning("*")
			// eslint-disable-next-line @typescript-eslint/camelcase
			.execute();

		return this.create(result.generatedMaps[0] as DeepPartial<Block>)
	}
}
