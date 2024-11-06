import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { HomeComponent } from './components/home/home.component';
import { WorkingVehiclesPageComponent } from './components/working-vehicles-page/working-vehicles-page.component';
import { BrokenVehiclesPageComponent } from './components/broken-vehicles-page/broken-vehicles-page.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'sign-up', component: SignUpComponent},
    {path: 'home', component: HomeComponent},
    {path: '', component: HomeComponent},
    {path: 'working-vehicles', component: WorkingVehiclesPageComponent},
    {path: 'broken-vehicles', component: BrokenVehiclesPageComponent},
];
