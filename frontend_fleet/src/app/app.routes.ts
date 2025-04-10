import { Routes } from '@angular/router';
import { LoginComponent } from './Common-components/login/login.component';
import { DashboardComponent } from './Dashboard/Components/dashboard/dashboard.component';
import { HomeMezziComponent } from './Mezzi/Components/home-mezzi/home-mezzi.component';
import { DettaglioMezzoComponent } from './Common-components/Scheda-mezzo/Components/dettaglio-mezzo/dettaglio-mezzo.component';
import { StoricoMezziComponent } from './Storico-mezzi/Components/storico-mezzi/storico-mezzi.component';
import { HomeMapComponent } from './Mappa/Components/home-map/home-map.component';
import { UserHomeComponent } from './Gestione-utenti/Components/user-home/user-home.component';
import { HomeGestioneComponent } from './Gestione-utenti/Components/home-gestione/home-gestione.component';
import { HomeProfileComponent } from './Profile/Components/home-profile/home-profile.component';
import { HomeGestioneCantieriComponent } from './Gestione-cantieri/Components/home-gestione-cantieri/home-gestione-cantieri.component';
import { HomeLettureComponent } from './Scarico-letture/home-letture/home-letture.component';
import { HomeGestioneSocietaComponent } from './Common-services/Gestione-Società/Components/home-gestione-societa/home-gestione-societa.component';
import { HomeGestioneVeicoliComponent } from './Gestione-Veicoli/Components/home-gestione-veicoli/home-gestione-veicoli.component';
import { AuthGuardService } from './Common-services/authGuard/auth-guard.service';
import { HomeCantiereEditComponent } from './Gestione-cantieri/Components/home-cantiere-edit/home-cantiere-edit.component';
import { NotificationsHomeComponent } from './Common-components/Notifications/Components/notifications-home/notifications-home.component';
import { HomeVeicoloEditComponent } from './Gestione-Veicoli/Components/home-veicolo-edit/home-veicolo-edit.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'home-mezzi',
    component: HomeMezziComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'dettaglio-mezzo/:id',
    component: DettaglioMezzoComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'home-mappa',
    component: HomeMapComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'storico-mezzi',
    component: StoricoMezziComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'profile/:id',
    component: UserHomeComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'profile',
    component: HomeProfileComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'gestione-utenti',
    component: HomeGestioneComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'gestione-cantieri',
    component: HomeGestioneCantieriComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'cantiere/:id',
    component: HomeCantiereEditComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'gestione-societa',
    component: HomeGestioneSocietaComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'gestione-veicoli',
    component: HomeGestioneVeicoliComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'gestione-veicolo/:id',
    component: HomeVeicoloEditComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'scarico-letture',
    component: HomeLettureComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'notifications',
    component: NotificationsHomeComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: '',
    component: LoginComponent
  }
];
