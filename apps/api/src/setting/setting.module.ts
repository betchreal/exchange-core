import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Metadata } from './entities/metadata.entity';
import { SetMetadata } from './bootstrap/setting.bootstrap';
import { SettingService } from './setting.service';

@Module({
	imports: [TypeOrmModule.forFeature([Metadata])],
	providers: [SettingService, SetMetadata],
	exports: [SettingService]
})
export class SettingModule {}
