import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import { Role } from '@exchange-core/common';
import { Principal } from '../../identity/entities/principal.entity';

@Entity('staff')
@Check(`email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$'`)
export class Staff {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'varchar',
		length: 254,
		unique: true
	})
	email: string;

	@Column({
		type: 'varchar',
		length: 60
	})
	passwordHash: string;

	@Column({
		type: 'enum',
		enum: Role,
		enumName: 'staff_role_enum'
	})
	role: Role;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@OneToOne(() => Principal, (principal) => principal.staff, {
		nullable: false,
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'principalId' })
	principal: Principal;
}
