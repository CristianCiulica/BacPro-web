import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './services/auth.service';
import { FirestoreService } from './services/firestore.service';

/** Rutele aplicației cer utilizator autentificat + onboarding finalizat. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady;
  if (!auth.currentUser) return router.parseUrl('/login');
  return true;
};

export const onboardedGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const firestore = inject(FirestoreService);
  const router = inject(Router);
  await auth.whenReady;
  const user = auth.currentUser;
  if (!user) return router.parseUrl('/login');
  try {
    const profile = await firestore.fetchProfile(user);
    if (!profile.onboardingCompleted) return router.parseUrl('/onboarding');
  } catch {
    // profilul nu a putut fi citit — lăsăm utilizatorul să intre (identic cu
    // fallback-ul pe defaults din aplicația mobilă doar la eroare de rețea)
  }
  return true;
};

/** Paginile de login redirecționează utilizatorii deja autentificați. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady;
  if (auth.currentUser) return router.parseUrl('/home');
  return true;
};
