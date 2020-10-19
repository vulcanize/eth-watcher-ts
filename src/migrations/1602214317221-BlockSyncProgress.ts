import {MigrationInterface, QueryRunner} from "typeorm";

export class BlockSyncProgress1602214317221 implements MigrationInterface {
    name = 'BlockSyncProgress1602214317221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            create table if not exists data.progress
            (
                progress_id serial not null
                    constraint progress_pk
                        primary key,
                event_id integer not null
                    constraint progress_events_event_id_fk
                        references contract.events,
                contract_id integer not null
                    constraint progress_contracts_contract_id_fk
                        references contract.contracts,
                block_number integer not null
            );
            comment on table data.progress is 'Sync progress';
            comment on column data.progress.event_id is 'Event ID';
            comment on column data.progress.contract_id is 'Contract ID';
            comment on column data.progress.block_number is 'Number of Block';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "data"."progress"`);
    }

}
