import {EntityRepository, Repository} from 'typeorm';
import Address from '../../models/data/address';
import { keccak256 } from 'ethereumjs-util';

@EntityRepository(Address)
export default class AddressRepository extends Repository<Address> {

	public findAll(): Promise<Address[]> {
		return this.find();
	}

	public async add(address: string): Promise<Address> {
		const hash = '0x' + keccak256(Buffer.from(address.replace('0x', ''), 'hex')).toString('hex');
		return this.save({
			address,
			hash,
		});
	}
}
