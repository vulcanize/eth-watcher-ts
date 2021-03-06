import {EntityRepository, QueryRunner, Table} from 'typeorm';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import {Structure} from "../../services/dataTypeParser";

@EntityRepository()
export default class AddressIdSlotIdRepository {
	private queryRunner: QueryRunner;

	constructor(queryRunner: QueryRunner) {
		this.queryRunner = queryRunner;
    }

    private getTableName(contractId: number, slotId: number): string {
		return `data.contract_id_${contractId}_address_slot_id_${slotId}`;
	}

	public async createTable(contractId: number, slotId: number): Promise<null> {
		const tableName = this.getTableName(contractId, slotId);
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

	public async add(contractId: number, addressId, slotId: number, hash: string): Promise<null> {
		const tableName = this.getTableName(contractId, slotId);
		const sql = `INSERT INTO ${tableName} (address_id, hash) VALUES (${addressId}, '${hash}');`;
		console.log(sql);

		return this.queryRunner.query(sql);
	}

	public async isExist(contractId: number, slotId: number, addressId: number): Promise<boolean> {
		const tableName = this.getTableName(contractId, slotId);
		const sql = `SELECT * FROM ${tableName} WHERE address_id=${addressId};`;

		const data = await this.queryRunner.query(sql);
		if (!data) {
			return false;
		}

		return data[0]?.address_id ? true : false;
	}

	public async getAddressIdByHash(contractId: number, slotId: number, hash: string): Promise<number> {
		const tableName = this.getTableName(contractId, slotId);
		const sql = `SELECT * FROM ${tableName} WHERE hash='${hash}';`;

		const data = await this.queryRunner.query(sql);
		if (!data) {
			return null;
		}

		return data[0]?.address_id;
	}

	public async syncAddressSlotHashes(contractId: number, slotId: number, stateStructure: Structure): Promise<void> {
		const sql = `UPDATE data.contract_id_${contractId}_state_id_${slotId} a
					SET address_id=b.address_id
					FROM data.contract_id_${contractId}_address_slot_id_${slotId} b
					WHERE
					  a.address_id IS NULL
					  AND a.${stateStructure.name}=b.hash`;

		return this.queryRunner.query(sql);
	}
}
