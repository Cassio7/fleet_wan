import { Test, TestingModule } from '@nestjs/testing';
import { WorkzoneService } from './workzone.service';

describe('WorkzoneService', () => {
  let service: WorkzoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkzoneService],
    }).compile();

    service = module.get<WorkzoneService>(WorkzoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
