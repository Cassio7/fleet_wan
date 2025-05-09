import { Test, TestingModule } from '@nestjs/testing';
import { SpeedService } from './speed.service';

describe('SpeedService', () => {
  let service: SpeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpeedService],
    }).compile();

    service = module.get<SpeedService>(SpeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
