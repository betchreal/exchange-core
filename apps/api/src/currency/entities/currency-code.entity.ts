import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('currency_codes')
@Check(`code ~ '^[A-Z0-9]{1,}$'`)
@Check(`btrim(description) <> ''`)
export class CurrencyCode {
	@PrimaryColumn({
		type: 'varchar',
		length: 16
	})
	code: string;

	@Column({
		type: 'varchar',
		length: 64
	})
	description: string;
}
