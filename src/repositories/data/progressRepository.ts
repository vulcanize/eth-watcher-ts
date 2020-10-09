import {EntityRepository, Repository} from 'typeorm';
import Progress from '../../models/data/progress';

@EntityRepository(Progress)
export default class ProgressRepository extends Repository<Progress> {

	public async add(contractId: number, eventId: number, blockNumber: number): Promise<Progress> {
		return this.save({
			contractId,
			eventId,
			blockNumber,
		});
	}

	public async isSync(contractId: number, eventId: number, blockNumber: number): Promise<boolean> {
		const item = await this.findOne({
			contractId,
			eventId,
			blockNumber,
		});

		if (item) {
			return true;
		}

		return false;
	}
}
