import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity('manual_merchants')
@Check(`btrim("paymentSystem") <> ''`)
@Check(`btrim("paymentAccount") <> ''`)
export class ManualMerchant {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'varchar',
		length: 128
	})
	paymentSystem: string;

	@Column({
		type: 'varchar',
		length: 128
	})
	paymentAccount: string;

	@Column({
		type: 'text',
		nullable: true
	})
	comment?: string;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;
}
