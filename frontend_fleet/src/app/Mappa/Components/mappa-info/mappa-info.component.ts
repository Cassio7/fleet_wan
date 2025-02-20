import { AfterViewInit, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MapService } from '../../../Common-services/map/map.service';
import { takeUntil, skip, Subject } from 'rxjs';

@Component({
  selector: 'app-mappa-info',
  standalone: true,
  imports: [
    MatListModule,
    MatIconModule
  ],
  templateUrl: './mappa-info.component.html',
  styleUrl: './mappa-info.component.css'
})
export class MappaInfoComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(private mapService:MapService){}

  ngAfterViewInit(): void {
    this.mapService.selectMarker$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (plate: string) => {
        //chiamata http anomaly
        //imposta dati
      },
      error: error => console.error("Errore nella selezione del marker: ", error)
    });
  }

}
