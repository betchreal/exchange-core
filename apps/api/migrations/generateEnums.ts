import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateEnums implements MigrationInterface {
	name = 'GenerateEnums1761928652882';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE order_status_enum AS ENUM (
             'not_paid',
             'processing',
             'in_payout',
             'hold',
             'success',
             'error_paid',
             'deleted'
           );`
		);
		await queryRunner.query(
			`CREATE TYPE plugin_status_enum AS ENUM ('installed', 'active', 'disabled');`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TYPE order_status_enum;`);
		await queryRunner.query(`DROP TYPE plugin_status_enum;`);
	}
}
