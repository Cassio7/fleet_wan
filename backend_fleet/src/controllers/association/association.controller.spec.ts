import { Test, TestingModule } from '@nestjs/testing';
import { AssociationController } from './association.controller';

describe('AssociationController', () => {
  let controller: AssociationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssociationController],
    }).compile();

    controller = module.get<AssociationController>(AssociationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
