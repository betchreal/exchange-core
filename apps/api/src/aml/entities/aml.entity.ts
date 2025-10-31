import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn
} from 'typeorm';
import { PluginStatus, type Manifest } from '@exchange-core/common';
import { Currency } from '../../currency/entities/currency.entity';
import { Route } from '../../route/entities/route.entity';

@Entity('amls')
@Unique(['name', 'version'])
@Check(`name ~ '^[a-z0-9][a-z0-9_-]*$'`)
@Check(`version ~ '^[a-z0-9][a-z0-9_.-]*$'`)
@Check(`entry = 'index.js'`)
@Check(`btrim(path) <> ''`)
export class Aml {
	@PrimaryGeneratedColumn()
	amlId: number;

	@Column({
		type: 'varchar',
		length: 32
	})
	name: string;

	@Column({
		type: 'varchar',
		length: 32
	})
	version: string;

	@Column({
		type: 'char',
		length: 8,
		default: 'index.js'
	})
	entry: string; // подумати, чи треба

	@Column({
		type: 'text'
	})
	path: string;

	@Column({
		type: 'enum',
		enum: PluginStatus,
		enumName: 'plugin_status_enum',
		default: PluginStatus.INSTALLED
	})
	status: PluginStatus;

	@Column({
		type: 'jsonb'
	})
	manifest: Manifest;

	@Column({
		type: 'jsonb',
		default: () => "'{}'::jsonb"
	})
	config: Record<string, any>;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@OneToMany(() => Currency, (currency) => currency.aml)
	currencies: Currency[];

	@OneToMany(() => Route, (route) => route.aml)
	routes: Route[];
}
