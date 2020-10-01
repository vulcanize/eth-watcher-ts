
import { getConnection } from 'typeorm';
import Contract from '../models/contract/contract';
import ContractRepository from '../repositories/contract/contractRepository';

export default class ContractService {

	public async loadContracts (): Promise<Contract[]> {
		const contractRepository: ContractRepository = getConnection().getCustomRepository(ContractRepository);
		const contracts = await contractRepository.findAll();

		return contracts;
	}

}
