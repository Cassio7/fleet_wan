import { Test, TestingModule } from '@nestjs/testing';
import { WorksiteController } from './worksite.controller';

describe('WorksiteController', () => {
  let controller: WorksiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksiteController],
    }).compile();

    controller = module.get<WorksiteController>(WorksiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
