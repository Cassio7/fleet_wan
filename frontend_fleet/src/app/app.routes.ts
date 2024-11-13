import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { BrokenVehiclesPageComponent } from './components/broken-vehicles-page/broken-vehicles-page.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorGraphComponent } from './components/error-graph/error-graph.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'sign-up', component: SignUpComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: '', component: DashboardComponent},
    {path: 'error-graph', component: ErrorGraphComponent},
    {path: 'broken-vehicles', component: BrokenVehiclesPageComponent},
];
