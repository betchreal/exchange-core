import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
	@PrimaryColumn('uuid')
	jti: string;

	@Column({
		type: 'timestamptz'
	})
	expAt: Date;
}
