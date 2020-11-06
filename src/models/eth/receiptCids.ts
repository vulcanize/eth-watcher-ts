import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import TransactionCids from "./transactionCids";

@Index("receipt_cids_pkey", ["id"], { unique: true })
@Index("receipt_cids_tx_id_key", ["txId"], { unique: true })
@Entity("receipt_cids", { schema: "eth" })
export default class ReceiptCids {
	@PrimaryGeneratedColumn({ type: "integer", name: "id" })
	id: number;

	@Column("integer", { name: "tx_id", unique: true })
	txId: number;

	@Column("text", { name: "cid" })
	cid: string;

	@Column("text", { name: "mh_key" })
	mhKey: string;

	@Column("character varying", { name: "contract", nullable: true, length: 66 })
	contract: string | null;

	@Column("character varying", {
		name: "contract_hash",
		nullable: true,
		length: 66,
	})
	contractHash: string | null;

	@Column("varchar", { name: "topic0s", nullable: true, array: true })
	topic0s: string[] | null;

	@Column("varchar", { name: "topic1s", nullable: true, array: true })
	topic1s: string[] | null;

	@Column("varchar", { name: "topic2s", nullable: true, array: true })
	topic2s: string[] | null;

	@Column("varchar", { name: "topic3s", nullable: true, array: true })
	topic3s: string[] | null;

	@Column("varchar", { name: "log_contracts", nullable: true, array: true })
	logContracts: string[] | null;

	@OneToOne(
		() => TransactionCids,
		(transactionCids) => transactionCids.receiptCids,
		{ onDelete: "CASCADE" }
	)
	@JoinColumn([{ name: "tx_id", referencedColumnName: "id" }])
	tx: TransactionCids;
}
