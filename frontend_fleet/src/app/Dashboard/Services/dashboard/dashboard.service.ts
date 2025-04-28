import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  lastUpdate = signal('');
  constructor() {}
}
