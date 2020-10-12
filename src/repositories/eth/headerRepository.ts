import {EntityRepository, Repository} from 'typeorm';
import Header from '../../models/eth/header';

@EntityRepository(Header)
export default class HeaderRepository extends Repository<Header> {

	public async findByBlockNumber(blockNumber: string | number): Promise<Header> {
		return this.findOne({
			where: {
				blockNumber: blockNumber as string,
			},
			relations: ['transactions'],
		});
	}
}
