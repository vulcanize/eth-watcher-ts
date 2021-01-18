import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveDeployment1611150552872 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE eth.transaction_cids DROP COLUMN deployment`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE eth.transaction_cids ADD deployment boolean NULL`);

    }

}
