import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("method_progress_pk", ["methodProgressId"], { unique: true })
@Entity("method_progress", { schema: "data" })

export default class MethodProgress {
	@PrimaryGeneratedColumn({ type: "integer", name: "method_progress_id" })
	methodProgressId: number;

	@Column("integer", { name: "contract_id" })
	contractId: number;

	@Column("integer", { name: "method_id" })
	methodId: number;

	@Column("integer", { name: "block_number" })
	blockNumber: number
}
