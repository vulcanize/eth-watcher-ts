import	{
		Column,
		Entity,
		Index,
		JoinColumn,
		ManyToOne,
		PrimaryGeneratedColumn,
}	from	"typeorm";
import	Header	from	"./header";

@Index("transaction_cids_header_id_tx_hash_key",	["headerId",	"txHash"],	{
		unique:	true,
})
@Index("transaction_cids_pkey",	["id"],	{	unique:	true	})
@Entity("transaction_cids",	{	schema:	"eth"	})
export	default	class	Transaction	{
		@PrimaryGeneratedColumn({	type:	"integer",	name:	"id"	})
		id:	number;

		@Column("integer",	{	name:	"header_id",	unique:	true	})
		headerId:	number;

		@Column("character varying",	{	name:	"tx_hash",	unique:	true,	length:	66	})
		txHash:	string;

		@Column("integer",	{	name:	"index"	})
		index:	number;

		@Column("text",	{	name:	"cid"	})
		cid:	string;

		@Column("text",	{	name:	"mh_key"	})
		mhKey:	string;

		@Column("character varying",	{	name:	"dst",	length:	66	})
		dst:	string;

		@Column("character varying",	{	name:	"src",	length:	66	})
		src:	string;

		@Column("boolean",	{	name:	"deployment"	})
		deployment:	boolean;

		@Column("bytea",	{	name:	"tx_data",	nullable:	true	})
		txData:	Buffer	|	null;

		@ManyToOne(()	=>	Header,	(header)	=>	header.transactions,	{
				onDelete:	"CASCADE",
		})
		@JoinColumn([{	name:	"header_id",	referencedColumnName:	"id"	}])
		header:	Header;
}
