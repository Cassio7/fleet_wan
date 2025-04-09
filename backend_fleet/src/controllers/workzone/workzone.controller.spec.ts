import { Test, TestingModule } from '@nestjs/testing';
import { WorkzoneController } from './workzone.controller';

describe('WorkzoneController', () => {
  let controller: WorkzoneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkzoneController],
    }).compile();

    controller = module.get<WorkzoneController>(WorkzoneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
