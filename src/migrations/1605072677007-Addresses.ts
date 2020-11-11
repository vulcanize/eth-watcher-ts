import {MigrationInterface, QueryRunner} from "typeorm";

export class Addresses1605072677007 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			create table if not exists data.addresses
			(
				address_id serial not null
					constraint addresses_pk
						primary key,
				address varchar not null,
				hash varchar not null
			);
			comment on column data.addresses.address_id is 'PK';
			comment on column data.addresses.address is 'Contract address';
			comment on column data.addresses.hash is 'Keccak hash';
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropTable('data.addresses');
	}

}
