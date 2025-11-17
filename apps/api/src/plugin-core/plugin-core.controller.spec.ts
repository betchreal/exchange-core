import { Test, TestingModule } from '@nestjs/testing';
import { PluginCoreController } from './plugin-core.controller';

describe('PluginCoreController', () => {
	let controller: PluginCoreController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PluginCoreController]
		}).compile();

		controller = module.get<PluginCoreController>(PluginCoreController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
