import { Test, TestingModule } from '@nestjs/testing';
import { AmlController } from './aml.controller';

describe('AmlController', () => {
	let controller: AmlController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AmlController]
		}).compile();

		controller = module.get<AmlController>(AmlController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
