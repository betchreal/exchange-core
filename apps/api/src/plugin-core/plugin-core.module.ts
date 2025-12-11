import { Module } from '@nestjs/common';
import { PluginCoreService } from './plugin-core.service';
import { PluginManager } from './engine/plugin.manager';
import { TicketModule } from '../ticket/ticket.module';
import { SettingModule } from '../setting/setting.module';

@Module({
	imports: [TicketModule, SettingModule],
	providers: [PluginCoreService, PluginManager],
	exports: [PluginCoreService]
})
export class PluginCoreModule {}
