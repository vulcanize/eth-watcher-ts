import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveEventData1602212621010 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('data.event_data');
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            create table if not exists data.event_data
            (
                event_data_id serial not null
                    constraint event_data_pk
                        primary key,
                event_id integer not null
                    constraint event_data_events_event_id_fk
                        references contract.events,
                data jsonb not null,
                contract_id integer not null
                    constraint event_data_contracts_contract_id_fk
                        references contract.contracts,
                mh_key text not null
            );
            comment on table data.event_data is 'Event Data';
            comment on column data.event_data.event_id is 'Event ID';
            comment on column data.event_data.data is 'Event Data';
            comment on column data.event_data.mh_key is 'IPLD Multi-Hash';
        `);
    }
}
