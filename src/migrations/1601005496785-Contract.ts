import {MigrationInterface, QueryRunner} from "typeorm";

export class Contract1601005496785 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			create schema contract;
			create table if not exists contract.contracts
			(
				contract_id serial not null
					constraint contracts_pk
						primary key,
				name varchar not null,
				address varchar not null,
				abi jsonb not null,
				events integer[],
				methods integer[],
				starting_block integer not null
			);
			comment on column contracts.contract_id is 'PK';
			comment on column contracts.name is 'Contract name';
			comment on column contracts.address is 'Contract address';
			comment on column contracts.abi is 'Contract ABI';
			comment on column contracts.events is 'List of Event ID';
			comment on column contracts.methods is 'List of Method ID';
			create table if not exists contract.events
			(
				event_id serial not null
					constraint events_pk
						primary key,
				name varchar not null
			);
			comment on column events.name is 'Event name';
			create table if not exists contract.methods
			(
				method_id serial not null
					constraint methods_pk
						primary key,
				name varchar not null
			);
			comment on column methods.method_id is 'PK';
			comment on column methods.name is 'Method name';
		`);
		
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropSchema('contract');
	}

}
