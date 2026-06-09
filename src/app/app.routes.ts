import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SnippetDetailComponent } from './pages/snippet-detail/snippet-detail.component';
import { SnippetFormComponent } from './pages/snippet-form/snippet-form.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'snippets/new', component: SnippetFormComponent },
  { path: 'snippets/:id', component: SnippetDetailComponent },
  { path: 'snippets/:id/edit', component: SnippetFormComponent },
  { path: '**', redirectTo: '' },
];
