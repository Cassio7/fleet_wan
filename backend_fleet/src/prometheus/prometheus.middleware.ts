import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: any, res: any, next: () => void) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000; // Durata in secondi
      this.prometheusService.httpRequestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      }); // Incrementa il contatore delle richieste
      this.prometheusService.responseDurationHistogram.observe(duration); // Aggiungi la durata al histogramma
    });

    next();
  }
}
