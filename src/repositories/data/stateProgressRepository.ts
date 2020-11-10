import {EntityRepository, Repository} from 'typeorm';
import StateProgress from '../../models/data/stateProgress';

@EntityRepository(StateProgress)
export default class StateProgressRepository extends Repository<StateProgress> {

	public async add(contractId: number, stateId: number, blockNumber: number): Promise<StateProgress> {
		return this.save({
			contractId,
			stateId,
			blockNumber,
		});
	}

	public async isSync(contractId: number, stateId: number, blockNumber: number): Promise<boolean> {
		const item = await this.findOne({
			contractId,
			stateId,
			blockNumber,
		});

		if (item) {
			return true;
		}

		return false;
	}

	public async findSyncedBlocks(contractId: number, stateId: number, offset = 0, limit = 1000): Promise<StateProgress[]> {
		const query = this.createQueryBuilder('state_progress')
			.where(`contract_id=${contractId}`)
			.andWhere(`state_id=${stateId}`)
			.orderBy({
				'state_progress.state_progress_id': 'ASC',
			})
			.take(limit)
			.offset(offset);

		return query.getMany();
	}

	public async getMaxBlockNumber(contractId: number, stateId: number): Promise<number> {
		const query = this.createQueryBuilder('state_progress')
			.where(`contract_id=${contractId}`)
			.andWhere(`state_id=${stateId}`)
			.select("MAX(state_progress.block_number)", "max");

		const result = await query.getRawOne();

		return result?.max || 0;
	}
}
