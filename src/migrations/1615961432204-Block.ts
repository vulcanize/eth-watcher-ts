import {MigrationInterface, QueryRunner} from "typeorm";

export class Block1615961432204 implements MigrationInterface {
    name = 'Block1615961432204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eth"."storage_cids" ADD CONSTRAINT "FK_dee8231f1ff5d769ad4ac914a5a" FOREIGN KEY ("mh_key") REFERENCES "eth"."block"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eth"."state_cids" ADD CONSTRAINT "FK_d1d0b950205d8c4cde1f7df3e0d" FOREIGN KEY ("mh_key") REFERENCES "eth"."block"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" ADD CONSTRAINT "FK_18e122e4df8c81e2c0635dc1c6b" FOREIGN KEY ("mh_key") REFERENCES "eth"."block"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eth"."transaction_cids" ADD CONSTRAINT "FK_c675308b39a02bad2e25ad4aa62" FOREIGN KEY ("mh_key") REFERENCES "eth"."block"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eth"."uncle_cids" ADD CONSTRAINT "FK_ed94421990915ed59a105a738df" FOREIGN KEY ("mh_key") REFERENCES "eth"."block"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eth"."header_cids" ADD CONSTRAINT "FK_d8de37c1a3d13baf47b1b527ad5" FOREIGN KEY ("mh_key") REFERENCES "eth"."block"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eth"."header_cids" DROP CONSTRAINT "FK_d8de37c1a3d13baf47b1b527ad5"`);
        await queryRunner.query(`ALTER TABLE "eth"."uncle_cids" DROP CONSTRAINT "FK_ed94421990915ed59a105a738df"`);
        await queryRunner.query(`ALTER TABLE "eth"."transaction_cids" DROP CONSTRAINT "FK_c675308b39a02bad2e25ad4aa62"`);
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" DROP CONSTRAINT "FK_18e122e4df8c81e2c0635dc1c6b"`);
        await queryRunner.query(`ALTER TABLE "eth"."state_cids" DROP CONSTRAINT "FK_d1d0b950205d8c4cde1f7df3e0d"`);
        await queryRunner.query(`ALTER TABLE "eth"."storage_cids" DROP CONSTRAINT "FK_dee8231f1ff5d769ad4ac914a5a"`);
    }

}
