import {MigrationInterface, QueryRunner} from "typeorm";

export class StateProgress1604987750715 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            create table if not exists data.state_progress
            (
                state_progress_id serial not null
                    constraint state_progress_pk
                        primary key,
                state_id integer not null
                    constraint state_progress_states_state_id_fk
                        references contract.state,
                contract_id integer not null
                    constraint state_progress_contracts_contract_id_fk
                        references contract.contracts,
                block_number integer not null
            );
            comment on table data.state_progress is 'Sync state progress';
            comment on column data.state_progress.state_id is 'State ID';
            comment on column data.state_progress.contract_id is 'Contract ID';
            comment on column data.state_progress.block_number is 'Number of Block';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "data"."state_progress"`);
    }

}
