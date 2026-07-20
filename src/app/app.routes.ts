import { Routes } from '@angular/router';

import { authGuard, guestGuard, onboardedGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },

  // Auth
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

  // Onboarding
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding').then((m) => m.OnboardingComponent),
  },

  // Shell cu taburi
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
    ],
  },

  // Fluxul de subiecte
  {
    path: 'subject/:profile/:subject',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subjects/selection').then((m) => m.YearSelectionComponent),
  },
  {
    path: 'subject/:profile/:subject/:year',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subjects/selection').then((m) => m.SessionSelectionComponent),
  },
  {
    path: 'subject/:profile/:subject/:year/:session',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subjects/subject-detail').then((m) => m.SubjectDetailComponent),
  },

  // Countdown
  {
    path: 'exam-date',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/countdown/set-exam-date').then((m) => m.SetExamDateComponent),
  },

  // Ecrane de cont
  {
    path: 'user-profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/user-profile').then((m) => m.UserProfileComponent),
  },
  {
    path: 'progress',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/progress').then((m) => m.ProgressScreenComponent),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/history').then((m) => m.HistoryComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/settings').then((m) => m.SettingsComponent),
  },
  {
    path: 'about',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/about').then((m) => m.AboutComponent),
  },
  {
    path: 'terms',
    canActivate: [authGuard],
    data: { kind: 'terms' },
    loadComponent: () => import('./features/account/about').then((m) => m.PolicyComponent),
  },
  {
    path: 'privacy',
    canActivate: [authGuard],
    data: { kind: 'privacy' },
    loadComponent: () => import('./features/account/about').then((m) => m.PolicyComponent),
  },
  {
    path: 'rating',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/rating').then((m) => m.RatingComponent),
  },
  {
    path: 'dev-messages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/dev-messages').then((m) => m.DevMessagesComponent),
  },

  { path: '**', redirectTo: 'home' },
];
