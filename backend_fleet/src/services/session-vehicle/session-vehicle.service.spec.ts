import { Test, TestingModule } from '@nestjs/testing';
import { SessionVehicleService } from './session-vehicle.service';

describe('SessionVehicleService', () => {
  let service: SessionVehicleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionVehicleService],
    }).compile();

    service = module.get<SessionVehicleService>(SessionVehicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
