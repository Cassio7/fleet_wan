import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SvgService {
  serviceMap = new Map<number, string>([
    [1, 'lavaggio.svg'],
    [2, 'movimentazione.svg'],
    [3, 'pedana.svg'],
    [4, 'raccolta.svg'],
    [5, 'ragno.svg'],
    [6, 'sanitari.svg'],
    [7, 'spazzamento.svg'],
    [8, 'trasferenza.svg'],
  ]);
  constructor() {}

  getServiceIcon(serviceId: number): string {
    const imageName = this.serviceMap.get(serviceId);
    return imageName
      ? `assets/service/${imageName}`
      : 'assets/service/raccolta.svg'; // Default per servizi non trovati
  }
}
