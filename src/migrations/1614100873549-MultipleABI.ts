import {MigrationInterface, QueryRunner} from "typeorm";

export class MultipleABI1614100873549 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `create table contract.abi
                (
                    abi_id serial  not null
                        constraint abi_pk
                            primary key,
                    name   varchar not null,
                    abi    jsonb   not null
                );
                
                comment on column contract.abi.name is 'ABI Name';
                comment on column contract.abi.abi is 'ABI';

                alter table contract.contracts add abis integer[];
                comment on column contract.contracts.abis is 'List of ID of ABI';

        create table contract.contract_to_abi
        (
            contract_to_abi_id serial not null
                constraint contract_to_abi_pk
                    primary key,
            contract_id        int    not null
                constraint contract_to_abi_contracts_contract_id_fk
                    references contract.contracts,
            abi_id             int    not null
                constraint contract_to_abi_abi_abi_id_fk
                    references contract.abi
        );


        `;

        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table contract.contracts drop column abis;`);
        await queryRunner.query(`DROP TABLE contract.abi`);
    }

}
