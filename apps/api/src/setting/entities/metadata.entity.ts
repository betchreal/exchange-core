import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('metadata')
export class Metadata {
	@PrimaryColumn('text')
	key: string;

	@Column({
		type: 'text'
	})
	value: string;
}
