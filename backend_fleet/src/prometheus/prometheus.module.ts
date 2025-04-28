import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { PrometheusController } from './prometheus.controller';

@Module({
  providers: [PrometheusService],
  exports: [PrometheusService],
  controllers: [PrometheusController],
})
export class PrometheusModule {}
