import { Test, TestingModule } from '@nestjs/testing';
import { AssociationService } from './association.service';

describe('AssociationService', () => {
  let service: AssociationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssociationService],
    }).compile();

    service = module.get<AssociationService>(AssociationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
