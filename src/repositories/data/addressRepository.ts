import {EntityRepository, Repository} from 'typeorm';
import Address from '../../models/data/address';

@EntityRepository(Address)
export default class AddressRepository extends Repository<Address> {

	public findAll(): Promise<Address[]> {
		return this.find();
	}

	public async add(address: string, hash: string): Promise<Address> {
		return this.save({
			address,
			hash,
		});
	}
}
