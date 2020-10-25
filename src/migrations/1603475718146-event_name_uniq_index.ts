import {MigrationInterface, QueryRunner} from "typeorm";

export class eventNameUniqIndex1603475718146 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        return queryRunner.query(`create unique index events_name_uindex on contract.events (name);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        return queryRunner.query(`drop index events_name_uindex`);
    }

}
