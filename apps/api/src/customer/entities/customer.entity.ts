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
import { Principal } from '../../identity/entities/principal.entity';

@Entity('customers')
@Check(`email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$'`)
export class Customer {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'varchar',
		length: 100
	})
	firstName: string;

	@Column({
		type: 'varchar',
		length: 100
	})
	lastName: string;

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

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@OneToOne(() => Principal, (principal) => principal.customer, {
		nullable: false,
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'principalId' })
	principal: Principal;
}
