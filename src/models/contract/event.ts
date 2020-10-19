import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("events_pk", ["eventId"], { unique: true })
@Entity("events", { schema: "contract" })

export default class Event {
	@PrimaryGeneratedColumn({ type: "integer", name: "event_id" })
	eventId: number;

	@Column("character varying", { name: "name" })
	name: string;
}
