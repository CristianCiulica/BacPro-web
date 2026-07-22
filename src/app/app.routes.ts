import { Routes } from '@angular/router';

import { authGuard, guestGuard, onboardedGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },

  // Auth (în afara shell-ului)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.LoginLandingComponent),
  },
  {
    path: 'login/form',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.LoginFormComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.RegisterComponent),
  },

  // Onboarding (în afara shell-ului)
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding').then((m) => m.OnboardingComponent),
  },

  // Shell — pe desktop dă sidebar persistent tuturor ecranelor autentificate;
  // pe mobil rămâne tab bar (pe taburi) + drawer (de pe Acasă).
  {
    path: '',
    canActivate: [authGuard, onboardedGuard],
    loadComponent: () => import('./features/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
      },
      {
        path: 'random',
        loadComponent: () => import('./features/random/random').then((m) => m.RandomComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile-tab/profile-tab').then((m) => m.ProfileTabComponent),
      },

      // Fluxul de subiecte
      {
        path: 'subject/:profile/:subject',
        loadComponent: () =>
          import('./features/subjects/selection').then((m) => m.YearSelectionComponent),
      },
      {
        path: 'subject/:profile/:subject/:year',
        loadComponent: () =>
          import('./features/subjects/selection').then((m) => m.SessionSelectionComponent),
      },
      {
        path: 'subject/:profile/:subject/:year/:session',
        loadComponent: () =>
          import('./features/subjects/subject-detail').then((m) => m.SubjectDetailComponent),
      },

      // Countdown
      {
        path: 'exam-date',
        loadComponent: () =>
          import('./features/countdown/set-exam-date').then((m) => m.SetExamDateComponent),
      },

      // Ecrane de cont
      {
        path: 'user-profile',
        loadComponent: () =>
          import('./features/account/user-profile').then((m) => m.UserProfileComponent),
      },
      {
        path: 'history',
        loadComponent: () => import('./features/account/history').then((m) => m.HistoryComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/account/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./features/account/about').then((m) => m.AboutComponent),
      },
      {
        path: 'terms',
        data: { kind: 'terms' },
        loadComponent: () => import('./features/account/about').then((m) => m.PolicyComponent),
      },
      {
        path: 'privacy',
        data: { kind: 'privacy' },
        loadComponent: () => import('./features/account/about').then((m) => m.PolicyComponent),
      },
      {
        path: 'dev-messages',
        loadComponent: () =>
          import('./features/account/dev-messages').then((m) => m.DevMessagesComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
