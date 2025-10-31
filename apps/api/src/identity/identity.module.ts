import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Principal } from './entities/principal.entity';
import { Session } from './entities/session.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Principal, Session])],
	controllers: [IdentityController],
	providers: [IdentityService]
})
export class IdentityModule {}
