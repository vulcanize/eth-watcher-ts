import {EntityRepository, QueryRunner, Table} from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';

@EntityRepository()
export default class AddressIdSlotIdRepository {
	private queryRunner: QueryRunner;

	constructor(queryRunner: QueryRunner) {
		this.queryRunner = queryRunner;
    }

	public async createTable(addressId, slotId): Promise<null> {
		const tableName = `data.address_id_${addressId}_slot_id_${slotId}`;
		const table = await this.queryRunner.getTable(tableName);

		if (table) {
			// console.log(`Table ${tableName} already exists`);
			return;
		}

		const tableOptions: TableOptions = {
			name: tableName,
			columns: [
				{
					name: 'id',
					type: 'integer',
					isPrimary: true,
					isGenerated: true,
					generationStrategy: 'increment'
				}, {
					name: 'address_id',
					type: 'integer',
				}, {
					name: 'hash',
					type: 'character varying',
				},
			]
		};

		await this.queryRunner.createTable(new Table(tableOptions), true);
		console.log('create new table', tableName);
	}

	public async add(cotractAddressId: number, addressId, slotId: number, hash: string): Promise<null> {
		const tableName = `data.address_id_${cotractAddressId}_slot_id_${slotId}`;
		const sql = `INSERT INTO ${tableName} (address_id, hash) VALUES (${addressId}, '${hash}');`;
		console.log(sql);

		return this.queryRunner.query(sql);
	}

	public async isExist(cotractAddressId: number, slotId: number, addressId: number): Promise<boolean> {
		const tableName = `data.address_id_${cotractAddressId}_slot_id_${slotId}`;
		const sql = `SELECT * FROM ${tableName} WHERE address_id=${addressId};`;

		const data = await this.queryRunner.query(sql);
		if (!data) {
			return false;
		}

		return data[0]?.address_id ? true : false;
	}

	public async getAddressIdByHash(cotractAddressId: number, slotId: number, hash: string): Promise<number> {
		const tableName = `data.address_id_${cotractAddressId}_slot_id_${slotId}`;
		const sql = `SELECT * FROM ${tableName} WHERE hash='${hash}';`;

		const data = await this.queryRunner.query(sql);
		if (!data) {
			return null;
		}

		return data[0]?.address_id;
	}
}
