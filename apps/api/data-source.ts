import 'dotenv/config';
import { DataSourceOptions, DataSource } from 'typeorm';
import process from 'node:process';
import { join } from 'node:path';

const TypeOrmOptions: DataSourceOptions = {
	type: 'postgres',
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	port: Number(process.env.DB_PORT),
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	entities: [join(__dirname, 'src', '**/*.entity.{js,ts}')],
	migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
	synchronize: false
};

export default new DataSource(TypeOrmOptions);
