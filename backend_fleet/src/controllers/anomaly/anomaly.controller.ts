import { AnomalyService } from './../../services/anomaly/anomaly.service';
import { Controller, Get } from '@nestjs/common';

@Controller('anomaly')
export class AnomalyController {
  constructor(private readonly anomalyService: AnomalyService) {}
  @Get()
  async getAllAnomaly() {}
}
