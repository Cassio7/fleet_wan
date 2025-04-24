import { Test, TestingModule } from '@nestjs/testing';
import { RefresherController } from './refresher.controller';

describe('RefresherController', () => {
  let controller: RefresherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefresherController],
    }).compile();

    controller = module.get<RefresherController>(RefresherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
