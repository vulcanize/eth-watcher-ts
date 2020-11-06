import {MigrationInterface, QueryRunner} from "typeorm";

export class Eth1603881988773 implements MigrationInterface {
    name = 'Eth1603881988773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE SCHEMA eth;

            CREATE TABLE eth.header_cids (
                id integer NOT NULL,
                block_number bigint NOT NULL,
                block_hash character varying(66) NOT NULL,
                parent_hash character varying(66) NOT NULL,
                cid text NOT NULL,
                mh_key text NOT NULL,
                td numeric NOT NULL,
                node_id integer NOT NULL,
                reward numeric NOT NULL,
                state_root character varying(66) NOT NULL,
                tx_root character varying(66) NOT NULL,
                receipt_root character varying(66) NOT NULL,
                uncle_root character varying(66) NOT NULL,
                bloom bytea NOT NULL,
                "timestamp" numeric NOT NULL,
                times_validated integer DEFAULT 1 NOT NULL
            );

            COMMENT ON TABLE eth.header_cids IS '@name EthHeaderCids';
            COMMENT ON COLUMN eth.header_cids.node_id IS '@name EthNodeID';

            CREATE SEQUENCE eth.header_cids_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            CREATE TABLE eth.receipt_cids (
                id integer NOT NULL,
                tx_id integer NOT NULL,
                cid text NOT NULL,
                mh_key text NOT NULL,
                contract character varying(66),
                contract_hash character varying(66),
                topic0s character varying(66)[],
                topic1s character varying(66)[],
                topic2s character varying(66)[],
                topic3s character varying(66)[],
                log_contracts character varying(66)[]
            );

            CREATE SEQUENCE eth.receipt_cids_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE eth.receipt_cids_id_seq OWNED BY eth.receipt_cids.id;

            CREATE TABLE eth.state_accounts (
                id integer NOT NULL,
                state_id integer NOT NULL,
                balance numeric NOT NULL,
                nonce integer NOT NULL,
                code_hash bytea NOT NULL,
                storage_root character varying(66) NOT NULL
            );

            CREATE SEQUENCE eth.state_accounts_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE eth.state_accounts_id_seq OWNED BY eth.state_accounts.id;

            CREATE TABLE eth.state_cids (
                id integer NOT NULL,
                header_id integer NOT NULL,
                state_leaf_key character varying(66),
                cid text NOT NULL,
                mh_key text NOT NULL,
                state_path bytea,
                node_type integer NOT NULL,
                diff boolean DEFAULT false NOT NULL
            );

            CREATE SEQUENCE eth.state_cids_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE eth.state_cids_id_seq OWNED BY eth.state_cids.id;

            CREATE TABLE eth.storage_cids (
                id integer NOT NULL,
                state_id integer NOT NULL,
                storage_leaf_key character varying(66),
                cid text NOT NULL,
                mh_key text NOT NULL,
                storage_path bytea,
                node_type integer NOT NULL,
                diff boolean DEFAULT false NOT NULL
            );

            CREATE SEQUENCE eth.storage_cids_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE eth.storage_cids_id_seq OWNED BY eth.storage_cids.id;

            CREATE TABLE eth.transaction_cids (
                id integer NOT NULL,
                header_id integer NOT NULL,
                tx_hash character varying(66) NOT NULL,
                index integer NOT NULL,
                cid text NOT NULL,
                mh_key text NOT NULL,
                dst character varying(66) NOT NULL,
                src character varying(66) NOT NULL,
                deployment boolean NOT NULL,
                tx_data bytea
            );

            COMMENT ON TABLE eth.transaction_cids IS '@name EthTransactionCids';

            CREATE SEQUENCE eth.transaction_cids_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE eth.transaction_cids_id_seq OWNED BY eth.transaction_cids.id;

            CREATE TABLE eth.uncle_cids (
                id integer NOT NULL,
                header_id integer NOT NULL,
                block_hash character varying(66) NOT NULL,
                parent_hash character varying(66) NOT NULL,
                cid text NOT NULL,
                mh_key text NOT NULL,
                reward numeric NOT NULL
            );

            CREATE SEQUENCE eth.uncle_cids_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE eth.uncle_cids_id_seq OWNED BY eth.uncle_cids.id;

            ALTER TABLE ONLY eth.header_cids ALTER COLUMN id SET DEFAULT nextval('eth.header_cids_id_seq'::regclass);
            ALTER TABLE ONLY eth.receipt_cids ALTER COLUMN id SET DEFAULT nextval('eth.receipt_cids_id_seq'::regclass);
            ALTER TABLE ONLY eth.state_accounts ALTER COLUMN id SET DEFAULT nextval('eth.state_accounts_id_seq'::regclass);
            ALTER TABLE ONLY eth.state_cids ALTER COLUMN id SET DEFAULT nextval('eth.state_cids_id_seq'::regclass);
            ALTER TABLE ONLY eth.storage_cids ALTER COLUMN id SET DEFAULT nextval('eth.storage_cids_id_seq'::regclass);
            ALTER TABLE ONLY eth.transaction_cids ALTER COLUMN id SET DEFAULT nextval('eth.transaction_cids_id_seq'::regclass);
            ALTER TABLE ONLY eth.uncle_cids ALTER COLUMN id SET DEFAULT nextval('eth.uncle_cids_id_seq'::regclass);

            ALTER TABLE ONLY eth.header_cids
                ADD CONSTRAINT header_cids_block_number_block_hash_key UNIQUE (block_number, block_hash);
            ALTER TABLE ONLY eth.header_cids
                ADD CONSTRAINT header_cids_pkey PRIMARY KEY (id);
            ALTER TABLE ONLY eth.receipt_cids
                ADD CONSTRAINT receipt_cids_pkey PRIMARY KEY (id);
            ALTER TABLE ONLY eth.receipt_cids
                ADD CONSTRAINT receipt_cids_tx_id_key UNIQUE (tx_id);
            ALTER TABLE ONLY eth.state_accounts
                ADD CONSTRAINT state_accounts_pkey PRIMARY KEY (id);
            ALTER TABLE ONLY eth.state_accounts
                ADD CONSTRAINT state_accounts_state_id_key UNIQUE (state_id);
            ALTER TABLE ONLY eth.state_cids
                ADD CONSTRAINT state_cids_header_id_state_path_key UNIQUE (header_id, state_path);
            ALTER TABLE ONLY eth.state_cids
                ADD CONSTRAINT state_cids_pkey PRIMARY KEY (id);
            ALTER TABLE ONLY eth.storage_cids
                ADD CONSTRAINT storage_cids_pkey PRIMARY KEY (id);
            ALTER TABLE ONLY eth.storage_cids
                ADD CONSTRAINT storage_cids_state_id_storage_path_key UNIQUE (state_id, storage_path);
            ALTER TABLE ONLY eth.transaction_cids
                ADD CONSTRAINT transaction_cids_header_id_tx_hash_key UNIQUE (header_id, tx_hash);
            ALTER TABLE ONLY eth.transaction_cids
                ADD CONSTRAINT transaction_cids_pkey PRIMARY KEY (id);
            ALTER TABLE ONLY eth.uncle_cids
                ADD CONSTRAINT uncle_cids_header_id_block_hash_key UNIQUE (header_id, block_hash);
            ALTER TABLE ONLY eth.uncle_cids
                ADD CONSTRAINT uncle_cids_pkey PRIMARY KEY (id);

            ALTER TABLE ONLY eth.receipt_cids
                ADD CONSTRAINT receipt_cids_tx_id_fkey FOREIGN KEY (tx_id) REFERENCES eth.transaction_cids(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
            ALTER TABLE ONLY eth.state_accounts
                ADD CONSTRAINT state_accounts_state_id_fkey FOREIGN KEY (state_id) REFERENCES eth.state_cids(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
            ALTER TABLE ONLY eth.state_cids
                ADD CONSTRAINT state_cids_header_id_fkey FOREIGN KEY (header_id) REFERENCES eth.header_cids(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
            ALTER TABLE ONLY eth.storage_cids
                ADD CONSTRAINT storage_cids_state_id_fkey FOREIGN KEY (state_id) REFERENCES eth.state_cids(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
            ALTER TABLE ONLY eth.transaction_cids
                ADD CONSTRAINT transaction_cids_header_id_fkey FOREIGN KEY (header_id) REFERENCES eth.header_cids(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
            ALTER TABLE ONLY eth.uncle_cids
                ADD CONSTRAINT uncle_cids_header_id_fkey FOREIGN KEY (header_id) REFERENCES eth.header_cids(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
    }

}
