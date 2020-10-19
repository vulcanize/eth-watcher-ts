import {EntityRepository, Repository} from 'typeorm';
import Block from '../../models/public/block';

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {

	public findByKey(key: string): Promise<Block> {
		return this.findOne({ key });
	}
}
