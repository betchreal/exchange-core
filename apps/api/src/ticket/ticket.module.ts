import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SettingModule } from '../setting/setting.module';

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (cfg: ConfigService) => ({
				privateKey: cfg
					.getOrThrow<string>('TICKET_PRIVATE_KEY')
					.replace(/\\n/g, '\n'),
				publicKey: cfg
					.getOrThrow<string>('TICKET_PUBLIC_KEY')
					.replace(/\\n/g, '\n'),
				signOptions: {
					algorithm: 'RS256',
					expiresIn: cfg.getOrThrow('TICKET_TTL')
				},
				verifyOptions: {
					algorithms: ['RS256']
				}
			})
		}),
		TypeOrmModule.forFeature([Ticket]),
		SettingModule
	],
	controllers: [TicketController],
	providers: [TicketService],
	exports: [TicketService]
})
export class TicketModule {}
