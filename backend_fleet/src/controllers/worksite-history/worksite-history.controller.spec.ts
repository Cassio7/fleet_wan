import { Test, TestingModule } from '@nestjs/testing';
import { WorksiteHistoryController } from './worksite-history.controller';

describe('WorksiteHistoryController', () => {
  let controller: WorksiteHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksiteHistoryController],
    }).compile();

    controller = module.get<WorksiteHistoryController>(
      WorksiteHistoryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
