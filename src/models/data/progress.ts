import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("progress_pk", ["progressId"], { unique: true })
@Entity("progress", { schema: "data" })

export default class Progress {
	@PrimaryGeneratedColumn({ type: "integer", name: "progress_id" })
	progressId: number;

	@Column("integer", { name: "contract_id" })
	contractId: number;

	@Column("integer", { name: "event_id" })
	eventId: number;

	@Column("integer", { name: "block_number" })
	blockNumber: number
}
