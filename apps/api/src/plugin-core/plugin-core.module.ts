import { Module } from '@nestjs/common';
import { PluginCoreService } from './plugin-core.service';
import { PluginManager } from './engine/plugin.manager';
import { TicketModule } from '../ticket/ticket.module';
import { SettingModule } from '../setting/setting.module';
import { PluginCoreController } from './plugin-core.controller';

@Module({
	imports: [TicketModule, SettingModule],
	providers: [PluginCoreService, PluginManager],
	exports: [PluginCoreService],
	controllers: [PluginCoreController]
})
export class PluginCoreModule {}
