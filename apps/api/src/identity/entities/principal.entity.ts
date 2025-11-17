import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import { PrincipalType } from '@exchange-core/common';
import { Staff } from '../../staff/entities/staff.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Session } from './session.entity';

@Entity('principals')
export class Principal {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'enum',
		enum: PrincipalType,
		enumName: 'principal_type_enum'
	})
	type: PrincipalType;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@OneToOne(() => Staff, (staff) => staff.principal)
	staff?: Staff | null;

	@OneToOne(() => Customer, (customer) => customer.principal)
	customer?: Customer | null;

	@OneToMany(() => Session, (session) => session.principal)
	sessions: Session[];
}
