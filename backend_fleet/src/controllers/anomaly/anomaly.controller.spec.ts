import { Test, TestingModule } from '@nestjs/testing';
import { AnomalyController } from './anomaly.controller';

describe('AnomalyController', () => {
  let controller: AnomalyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnomalyController],
    }).compile();

    controller = module.get<AnomalyController>(AnomalyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
