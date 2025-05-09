import { Test, TestingModule } from '@nestjs/testing';
import { SpeedController } from './speed.controller';

describe('SpeedController', () => {
  let controller: SpeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeedController],
    }).compile();

    controller = module.get<SpeedController>(SpeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
