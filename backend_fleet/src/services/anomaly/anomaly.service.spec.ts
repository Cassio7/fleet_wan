import { Test, TestingModule } from '@nestjs/testing';
import { AnomalyService } from './anomaly.service';

describe('AnomalyService', () => {
  let service: AnomalyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnomalyService],
    }).compile();

    service = module.get<AnomalyService>(AnomalyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
