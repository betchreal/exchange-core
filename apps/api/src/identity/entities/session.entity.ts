import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { Principal } from './principal.entity';

@Entity('sessions')
export class Session {
	@PrimaryGeneratedColumn()
	sessionId: number;

	@Column({
		type: 'uuid',
		unique: true
	})
	jti: string;

	@Column({
		type: 'inet',
		nullable: true
	})
	ip: string | null;

	@Column({
		type: 'varchar',
		length: 512,
		nullable: true
	})
	ua: string | null;

	@Column({
		type: 'varchar',
		length: 60,
		nullable: true
	})
	hashedRefreshToken: string | null;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@ManyToOne(() => Principal, (principal) => principal.sessions, {
		nullable: false,
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'principalId' })
	principal: Principal;
}
