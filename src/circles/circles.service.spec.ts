import { Test, TestingModule } from '@nestjs/testing';
import { CirclesService } from './circles.service';

describe('CirclesService', () => {
  let service: CirclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CirclesService],
    }).compile();

    service = module.get<CirclesService>(CirclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
