import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("event_data_pk", ["eventDataId"], { unique: true })
@Entity("event_data", { schema: "data" })
export default class EventData {
	@PrimaryGeneratedColumn({ type: "integer", name: "event_data_id" })
	eventDataId: number;

	@Column("integer", { name: "event_id" })
	eventId: number;

	@Column("jsonb", { name: "data" })
	data: object;

	@Column("integer", { name: "contract_id" })
	contractId: number;

	@Column("text", { name: "mh_key" })
	mhKey: string;
}
