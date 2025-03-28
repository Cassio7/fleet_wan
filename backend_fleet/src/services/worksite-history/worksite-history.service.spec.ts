import { Test, TestingModule } from '@nestjs/testing';
import { WorksiteHistoryService } from './worksite-history.service';

describe('WorksiteHistoryService', () => {
  let service: WorksiteHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorksiteHistoryService],
    }).compile();

    service = module.get<WorksiteHistoryService>(WorksiteHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
