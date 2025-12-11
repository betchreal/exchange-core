import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DecimalPipe } from './shared/pipes/decimal.pipe';
import { PgErrorFilter } from './shared/filters/pg-error.filter';
import 'dotenv/config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: process.env.FRONTEND_URL,
		credentials: true
	});

	app.use(cookieParser());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true
		}),
		new DecimalPipe()
	);
	app.useGlobalFilters(new PgErrorFilter());

	const config = new DocumentBuilder()
		.setTitle('Exchange Core')
		.setVersion('1.0.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document);

	await app.listen(process.env.PORT ?? 3002);
}

Decimal.set({
	precision: 40,
	rounding: Decimal.ROUND_HALF_UP
});

bootstrap()
	.then(() => console.log(`Server is listening ${process.env.PORT ?? 3002}`))
	.catch((e) => {
		throw e;
	});
