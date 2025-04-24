import { Test, TestingModule } from '@nestjs/testing';
import { RefresherService } from './refresher.service';

describe('RefresherService', () => {
  let service: RefresherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefresherService],
    }).compile();

    service = module.get<RefresherService>(RefresherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
