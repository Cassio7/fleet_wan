import { Routes } from '@angular/router';
import { LoginComponent } from './Common-components/login/login.component';
import { DashboardComponent } from './Dashboard/Components/dashboard/dashboard.component';
import { HomeMezziComponent } from './Mezzi/Components/home-mezzi/home-mezzi.component';
import { DettaglioMezzoComponent } from './Common-components/Scheda-mezzo/dettaglio-mezzo/dettaglio-mezzo.component';
import { StoricoMezziComponent } from './Storico-mezzi/Components/storico-mezzi/storico-mezzi.component';
import { HomeMapComponent } from './Mappa/Components/home-map/home-map.component';
import { UserHomeComponent } from './Gestione-utenti/Components/user-home/user-home.component';
import { HomeGestioneComponent } from './Gestione-utenti/Components/home-gestione/home-gestione.component';
import { HomeProfileComponent } from './Profile/Components/home-profile/home-profile.component';
import { HomeGestioneCantieriComponent } from './Gestione-cantieri/Components/home-gestione-cantieri/home-gestione-cantieri.component';
import { HomeLettureComponent } from './Scarico-letture/home-letture/home-letture.component';
import { HomeGestioneSocietaComponent } from './Gestione-Società/Components/home-gestione-societa/home-gestione-societa.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'home-mezzi', component: HomeMezziComponent },
    { path: 'dettaglio-mezzo/:id', component:DettaglioMezzoComponent },
    { path: 'home-mappa', component: HomeMapComponent},
    { path: 'storico-mezzi', component:StoricoMezziComponent },
    { path: 'profile/:id', component: UserHomeComponent},
    { path: 'profile', component: HomeProfileComponent},
    { path: 'gestione-utenti', component: HomeGestioneComponent},
    { path: 'gestione-cantieri', component: HomeGestioneCantieriComponent},
    { path: 'gestione-societa', component: HomeGestioneSocietaComponent},
    { path: 'scarico-letture', component: HomeLettureComponent },
    { path: '', component: DashboardComponent },
];
