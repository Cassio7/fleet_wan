import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;

  // Esempio di un contatore
  public readonly httpRequestCounter: Counter<string>;

  // Esempio di un histogramma per i tempi di risposta
  public readonly responseDurationHistogram: Histogram<string>;

  constructor() {
    this.registry = new Registry();

    // Definiamo un contatore per le richieste HTTP
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests received',
      labelNames: ['method', 'status_code'],
    });

    // Definiamo un histogramma per la durata delle risposte
    this.responseDurationHistogram = new Histogram({
      name: 'http_response_duration_seconds',
      help: 'Histogram of HTTP response durations',
      buckets: [0.1, 0.3, 0.5, 1, 2, 5],
    });

    // Registriamo le metriche nel registry
    this.registry.registerMetric(this.httpRequestCounter);
    this.registry.registerMetric(this.responseDurationHistogram);
  }

  // Metodo per ottenere le metriche nel formato che Prometheus può leggere
  async getMetrics() {
    return this.registry.metrics();
  }
}
