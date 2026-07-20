/**
 * Fluxul de autentificare — port al lib/src/screens/login_screen.dart:
 * LoginScreen (landing), LoginFormScreen, RegisterScreen.
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { AuthError, AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthUserLike } from '../../core/models/profile-data';
import {
  AppButtonComponent,
  DialogService,
  IconComponent,
} from '../../ui/ui';
import {
  GOOGLE_ERROR_GENERIC,
  GOOGLE_ERROR_NOT_CONFIGURED,
  GOOGLE_LOGO_SVG,
  friendlyLoginError,
  friendlyRegisterError,
} from './auth-shared';

/**
 * Echivalentul enterAppAfterAuth: citește profilul o singură dată și
 * navighează determinist către onboarding sau aplicație.
 */
export async function enterAppAfterAuth(
  router: Router,
  firestore: FirestoreService,
  user: AuthUserLike,
): Promise<void> {
  let onboarded = false;
  try {
    onboarded = (await firestore.fetchProfile(user)).onboardingCompleted;
  } catch {
    onboarded = false;
  }
  await router.navigateByUrl(onboarded ? '/home' : '/onboarding', { replaceUrl: true });
}

const AUTH_STYLES = `
  .wrap {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--x5) var(--x5) var(--x4);
  }
  .panel {
    width: 100%;
    max-width: 430px;
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-floating);
    padding: var(--x5) var(--x6) var(--x6);
    display: flex;
    flex-direction: column;
  }
  .back-row { align-self: flex-start; background: none; border: none; color: var(--blue); padding: 0; cursor: pointer; }
  .heading {
    margin-top: var(--x2);
    text-align: center;
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.7px;
    color: var(--label);
  }
  .sub { text-align: center; margin-top: 6px; }
  .fields { display: flex; flex-direction: column; gap: var(--x3); margin-top: var(--x6); }
  .suffix-btn { background: none; border: none; padding: 0 14px 0 0; color: var(--label-3); cursor: pointer; display: flex; }
  .forgot {
    align-self: flex-end;
    margin-top: var(--x2);
    background: none; border: none; padding: 0;
    color: var(--blue); font-weight: 600; font-size: 14px; cursor: pointer;
  }
  .divider { display: flex; align-items: center; gap: var(--x3); margin: var(--x4) 0; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 0.5px; background: var(--separator); }
  .google-btn {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--x3);
    background: var(--surface);
    border: 1px solid var(--separator);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-soft);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--label);
    cursor: pointer;
  }
  .google-btn:disabled { opacity: 0.45; }
  .switch-link { text-align: center; margin-top: var(--x5); cursor: pointer; }
  .switch-link b { color: var(--blue); font-weight: 600; }
`;

/* -------------------------------------------------------------- Landing -- */
@Component({
  selector: 'app-login-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, RouterLink],
  template: `
    <div class="aurora">
      <div class="landing">
        <div class="hero-block">
          <img class="hero" src="assets/images/login_hero.png" alt="BacPro" />
          <h1 class="brand">BacPro</h1>
          <p class="t-subhead tagline">Bacalaureatul, mai simplu.</p>
        </div>
        <div class="cta">
          <app-button label="Autentificare" [height]="56" routerLink="/login/form" />
          <app-button label="Creează cont" btnStyle="glass" [height]="56" routerLink="/register" />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .landing {
        min-height: 100dvh;
        max-width: 460px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--x5) var(--x6) var(--x6);
      }
      .hero-block { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .hero {
        width: 118px; height: 118px;
        object-fit: cover;
        border-radius: var(--r-xl);
        border: 2px solid #fff;
        box-shadow: var(--shadow-floating), 0 18px 50px rgba(0, 122, 255, 0.14);
      }
      .brand {
        margin: var(--x6) 0 0;
        font-family: var(--font-display);
        font-size: 46px;
        font-weight: 800;
        letter-spacing: -1.6px;
        background: linear-gradient(135deg, #0b0f1c 30%, #007AFF);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .tagline { margin: var(--x2) 0 0; font-size: 16px; line-height: 1.4; }
      .cta { display: flex; flex-direction: column; gap: var(--x3); padding-bottom: var(--x6); }
    `,
  ],
})
export class LoginLandingComponent {}

/* ------------------------------------------------------------ Login form -- */
@Component({
  selector: 'app-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, IconComponent],
  template: `
    <div class="aurora">
      <div class="wrap">
        <div class="panel glass-panel">
          <button class="back-row" (click)="back()" aria-label="Înapoi">
            <app-icon name="chevron-back" [size]="24" />
          </button>
          <div class="heading">Autentificare</div>
          <div class="t-subhead sub">Continuă-ți pregătirea.</div>

          <div class="fields">
            <div class="app-input">
              <app-icon name="envelope" [size]="20" />
              <input type="email" placeholder="Email" [(ngModel)]="email" autocomplete="email" />
            </div>
            <div class="app-input">
              <app-icon name="lock" [size]="20" />
              <input
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Parolă"
                [(ngModel)]="password"
                autocomplete="current-password"
              />
              <button class="suffix-btn" (click)="showPassword.set(!showPassword())" aria-label="Arată parola">
                <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="19" />
              </button>
            </div>
          </div>

          <button class="forgot" [disabled]="loading()" (click)="resetPassword()">Ai uitat parola?</button>

          <div style="margin-top: var(--x3)">
            <app-button label="Intră în cont" [loading]="loading()" [disabled]="loading()" (pressed)="signIn()" />
          </div>

          <div class="divider"><span class="t-caption">sau continuă cu</span></div>

          <button class="google-btn pressable" [disabled]="loading()" (click)="signInWithGoogle()">
            <span [innerHTML]="googleLogo"></span>
            Continuă cu Google
          </button>

          <div class="switch-link t-subhead" (click)="goRegister()">
            Nu ai cont?&nbsp; <b>Creează unul</b>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [AUTH_STYLES],
})
export class LoginFormComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  email = '';
  password = '';
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly googleLogo: SafeHtml = inject(DomSanitizer).bypassSecurityTrustHtml(GOOGLE_LOGO_SVG);

  back(): void {
    this.router.navigateByUrl('/login');
  }

  goRegister(): void {
    this.settings.selection();
    this.router.navigateByUrl('/register', { replaceUrl: true });
  }

  async signIn(): Promise<void> {
    const email = this.email.trim();
    const password = this.password;
    if (email === '' || password === '') {
      await this.dialogs.alert('Eroare', 'Completează email-ul și parola.');
      return;
    }
    this.loading.set(true);
    try {
      const user = await this.auth.signInWithEmail(email, password);
      await enterAppAfterAuth(this.router, this.firestore, user);
    } catch (e) {
      if (e instanceof AuthError) {
        await this.dialogs.alert('Eroare', friendlyLoginError(e.code));
      } else {
        await this.dialogs.alert('Eroare', 'Ceva nu a mers bine. Încearcă din nou.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    try {
      const user = await this.auth.signInWithGoogle();
      if (user === null) {
        this.loading.set(false);
        return;
      }
      await enterAppAfterAuth(this.router, this.firestore, user);
    } catch (e) {
      const msg =
        e instanceof AuthError && e.code === 'firebase-not-configured'
          ? GOOGLE_ERROR_NOT_CONFIGURED
          : GOOGLE_ERROR_GENERIC;
      await this.dialogs.alert('Eroare', msg);
      this.loading.set(false);
    }
  }

  async resetPassword(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    if (email === '') {
      await this.dialogs.alert('Eroare', 'Introdu email-ul mai întâi.');
      return;
    }
    try {
      await this.auth.resetPassword(email);
      await this.dialogs.alert('Info', `Email de resetare trimis la ${email}`);
    } catch (e) {
      if (e instanceof AuthError) {
        await this.dialogs.alert('Eroare', friendlyLoginError(e.code));
      }
    }
  }
}

/* -------------------------------------------------------------- Register -- */
@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, IconComponent],
  template: `
    <div class="aurora">
      <div class="wrap">
        <div class="panel glass-panel">
          <button class="back-row" (click)="back()" aria-label="Înapoi">
            <app-icon name="chevron-back" [size]="24" />
          </button>
          <div class="heading">Creează cont</div>
          <div class="t-subhead sub">Îți salvăm progresul și sesiunile.</div>

          <div class="fields">
            <div class="app-input">
              <app-icon name="envelope" [size]="20" />
              <input type="email" placeholder="Email" [(ngModel)]="email" autocomplete="email" />
            </div>
            <div class="app-input">
              <app-icon name="lock" [size]="20" />
              <input
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Parolă"
                [(ngModel)]="password"
                autocomplete="new-password"
              />
              <button class="suffix-btn" (click)="showPassword.set(!showPassword())" aria-label="Arată parola">
                <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="19" />
              </button>
            </div>
            <div class="app-input">
              <app-icon name="lock-rotation" [size]="20" />
              <input
                [type]="showConfirm() ? 'text' : 'password'"
                placeholder="Confirmă parola"
                [(ngModel)]="confirm"
                autocomplete="new-password"
              />
              <button class="suffix-btn" (click)="showConfirm.set(!showConfirm())" aria-label="Arată parola">
                <app-icon [name]="showConfirm() ? 'eye-off' : 'eye'" [size]="19" />
              </button>
            </div>
          </div>

          <div style="margin-top: var(--x5)">
            <app-button label="Creează cont" [loading]="loading()" [disabled]="loading()" (pressed)="register()" />
          </div>

          <div class="divider"><span class="t-caption">sau continuă cu</span></div>

          <button class="google-btn pressable" [disabled]="loading()" (click)="signInWithGoogle()">
            <span [innerHTML]="googleLogo"></span>
            Continuă cu Google
          </button>

          <div class="switch-link t-subhead" (click)="goLogin()">
            Ai deja cont?&nbsp; <b>Intră în cont</b>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [AUTH_STYLES],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  email = '';
  password = '';
  confirm = '';
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly loading = signal(false);
  readonly googleLogo: SafeHtml = inject(DomSanitizer).bypassSecurityTrustHtml(GOOGLE_LOGO_SVG);

  back(): void {
    this.router.navigateByUrl('/login');
  }

  goLogin(): void {
    this.settings.selection();
    this.router.navigateByUrl('/login/form', { replaceUrl: true });
  }

  async register(): Promise<void> {
    const email = this.email.trim();
    if (email === '' || this.password === '' || this.confirm === '') {
      await this.dialogs.alert('Eroare', 'Completează toate câmpurile.');
      return;
    }
    if (this.password !== this.confirm) {
      await this.dialogs.alert('Eroare', 'Parolele nu coincid.');
      return;
    }
    if (this.password.length < 6) {
      await this.dialogs.alert('Eroare', 'Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.registerWithEmail(email, this.password);
      // Un cont proaspăt creat e mereu nou — direct la onboarding.
      await this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    } catch (e) {
      if (e instanceof AuthError) {
        await this.dialogs.alert('Eroare', friendlyRegisterError(e.code));
      } else {
        await this.dialogs.alert('Eroare', 'Ceva nu a mers bine. Încearcă din nou.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    try {
      const user = await this.auth.signInWithGoogle();
      if (user === null) {
        this.loading.set(false);
        return;
      }
      await enterAppAfterAuth(this.router, this.firestore, user);
    } catch (e) {
      const msg =
        e instanceof AuthError && e.code === 'firebase-not-configured'
          ? GOOGLE_ERROR_NOT_CONFIGURED
          : GOOGLE_ERROR_GENERIC;
      await this.dialogs.alert('Eroare', msg);
      this.loading.set(false);
    }
  }
}
