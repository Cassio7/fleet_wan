import { Routes } from '@angular/router';
import { LoginComponent } from './Common-components/login/login.component';
import { SignUpComponent } from './Common-components/sign-up/sign-up.component';
import { DashboardComponent } from './Dashboard/Components/dashboard/dashboard.component';
import { ErrorBarGraphComponent } from './Dashboard/Components/error graphs/error-bar-graph/error-bar-graph.component';
import { HomeMezziComponent } from './Mezzi/Components/home-mezzi/home-mezzi.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'sign-up', component: SignUpComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'home-mezzi', component: HomeMezziComponent},
    {path: '', component: DashboardComponent},
];
