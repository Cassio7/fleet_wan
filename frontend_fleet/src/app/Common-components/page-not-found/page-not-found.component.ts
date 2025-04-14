import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../Common-services/navigation/navigation.service';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css'
})
export class PageNotFoundComponent{
}
