import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("state_progress_pk", ["stateProgressId"], { unique: true })
@Entity("state_progress", { schema: "data" })

export default class StateProgress {
	@PrimaryGeneratedColumn({ type: "integer", name: "state_progress_id" })
	stateProgressId: number;

	@Column("integer", { name: "contract_id" })
	contractId: number;

	@Column("integer", { name: "state_id" })
	stateId: number;

	@Column("integer", { name: "block_number" })
	blockNumber: number
}
