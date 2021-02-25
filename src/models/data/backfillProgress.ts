import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("backfill_progress_pk", ["backfillProgressId"], { unique: true })
@Entity("backfill_progress", { schema: "data" })

export default class BackfillProgress {
	@PrimaryGeneratedColumn({ type: "integer", name: "backfill_progress_id" })
	backfillProgressId: number;

	@Column("integer", { name: "contract_id" })
	contractId: number;

	@Column("integer", { name: "current" })
	current: number;

	@Column("integer", { name: "total" })
	total: number;
}
