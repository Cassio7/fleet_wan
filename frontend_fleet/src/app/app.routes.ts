import { Routes } from '@angular/router';
import { LoginComponent } from './Common-components/login/login.component';
import { SignUpComponent } from './Common-components/sign-up/sign-up.component';
import { DashboardComponent } from './Dashboard/Components/dashboard/dashboard.component';
import { HomeMezziComponent } from './Mezzi/Components/home-mezzi/home-mezzi.component';
import { DettaglioMezzoComponent } from './Common-components/Scheda-mezzo/dettaglio-mezzo/dettaglio-mezzo.component';
import { StoricoMezziComponent } from './Storico-mezzi/Components/storico-mezzi/storico-mezzi.component';
import { HomeMapComponent } from './Mappa/Components/home-map/home-map.component';
import { HomeProfileComponent } from './Profile/Components/home-profile/home-profile.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'sign-up', component: SignUpComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'home-mezzi', component: HomeMezziComponent },
    { path: 'dettaglio-mezzo/:id', component:DettaglioMezzoComponent },
    { path: 'home-mappa', component: HomeMapComponent},
    { path: 'storico-mezzi', component:StoricoMezziComponent },
    { path: 'profile', component: HomeProfileComponent},
    { path: '', component: DashboardComponent },
];
