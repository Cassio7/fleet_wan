import { Test, TestingModule } from '@nestjs/testing';
import { WorksiteService } from './worksite.service';

describe('WorksiteService', () => {
  let service: WorksiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorksiteService],
    }).compile();

    service = module.get<WorksiteService>(WorksiteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
