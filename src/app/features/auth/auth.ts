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
    align-items: flex-start;
    justify-content: center;
    padding: 12vh var(--x5) var(--x4);
    background: var(--bg);
  }
  .panel {
    width: 100%;
    max-width: 430px;
    display: flex;
    flex-direction: column;
  }
  .back-row {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--label-2);
    padding: 0;
    cursor: pointer;
    margin-bottom: var(--x5);
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 17px;
  }
  .heading {
    margin-top: 0;
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.8px;
    color: var(--label);
  }
  .sub {
    margin-top: 10px;
    color: var(--label-2);
    font-size: 17px;
    line-height: 1.4;
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 40px;
  }
  .app-input {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 10px 16px;
    min-height: 68px;
    background: var(--surface);
    border-radius: 16px;
    border: 1.5px solid var(--separator);
    transition: border-color 0.2s ease-out;
  }
  .app-input:focus-within {
    border-color: var(--label-3);
  }
  .app-input label {
    font-size: 13px;
    font-weight: 500;
    color: var(--label-2);
    margin-bottom: 4px;
    align-self: flex-start;
    text-align: left;
    width: 100%;
  }
  .input-row {
    display: flex;
    align-items: center;
    width: 100%;
  }
  .input-row input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 18px;
    color: var(--label);
    outline: none;
    padding: 0;
  }
  .suffix-btn {
    background: none;
    border: none;
    padding: 0;
    color: var(--label-3);
    cursor: pointer;
    display: flex;
    margin-left: 8px;
  }
  .forgot {
    align-self: flex-end;
    margin-top: var(--x4);
    background: none;
    border: none;
    padding: 0;
    color: var(--label-2);
    font-size: 15px;
    cursor: pointer;
  }
  .divider {
    display: flex;
    align-items: center;
    gap: var(--x3);
    margin: var(--x6) 0;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 0.5px;
    background: var(--separator);
  }
  .divider span {
    color: var(--label-3);
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .google-btn {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--x3);
    background: transparent;
    border: 1px solid var(--separator);
    border-radius: var(--r-md);
    font-size: 17px;
    font-weight: 500;
    color: var(--label);
    cursor: pointer;
    transition: background 0.2s;
  }
  .google-btn:active { background: var(--fill); }
  .google-btn:disabled { opacity: 0.45; }
  .switch-link {
    text-align: center;
    margin-top: var(--x8);
    cursor: pointer;
    font-size: 16px;
    color: var(--label-2);
  }
  .switch-link b {
    color: var(--label);
    font-weight: 600;
  }
`;

/* -------------------------------------------------------------- Landing -- */
@Component({
  selector: 'app-login-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, RouterLink],
  template: `
    <div class="landing-bg">
      <div class="landing">
        <div class="hero-block">
          <div class="logo-wrap">
            <img class="hero" src="assets/images/login_hero_mono.jpg" alt="BacPro Hero" />
          </div>
          <h1 class="brand">BacPro</h1>
          <p class="tagline">Bacalaureatul, mai simplu.</p>
        </div>
        <div class="cta">
          <app-button label="Intră în cont" [height]="56" accent="var(--label)" routerLink="/login/form" />
          <button class="text-link" routerLink="/register">Nu ai cont? Creează unul</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .landing-bg {
        background: var(--bg);
        min-height: 100dvh;
      }
      .landing {
        min-height: 100dvh;
        max-width: 460px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 64px 24px 48px;
      }
      .hero-block { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .logo-wrap {
        width: 132px; height: 132px;
        border-radius: 30px;
        overflow: hidden;
        background: var(--fill-secondary);
        margin-bottom: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 0 0 0.5px var(--separator);
      }
      .hero {
        width: 100%; height: 100%;
        object-fit: cover;
      }
      .brand {
        font-family: var(--font-display);
        font-size: 40px;
        font-weight: 700;
        letter-spacing: -1.2px;
        color: var(--label);
        margin: 0;
      }
      .tagline { margin: 8px 0 0; font-size: 17px; color: var(--label-2); }
      .cta { display: flex; flex-direction: column; gap: 16px; padding-bottom: env(safe-area-inset-bottom, 0px); }
      .text-link {
        background: none;
        border: none;
        padding: 12px;
        font-size: 16px;
        font-weight: 500;
        color: var(--label-2);
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .text-link:active { opacity: 0.6; }
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
    <div class="landing-bg">
      <div class="wrap">
        <div class="panel">
          <button class="back-row" (click)="back()" aria-label="Înapoi">
            <app-icon name="chevron-back" [size]="20" />
            <span>Înapoi</span>
          </button>
          
          <div class="heading">Autentificare</div>
          <div class="sub">Continuă-ți pregătirea.</div>

          <div class="fields">
            <div class="app-input">
              <label>Email</label>
              <div class="input-row">
                <input type="email" [(ngModel)]="email" autocomplete="email" />
              </div>
            </div>
            <div class="app-input">
              <label>Parolă</label>
              <div class="input-row">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  autocomplete="current-password"
                />
                <button class="suffix-btn" (click)="showPassword.set(!showPassword())" aria-label="Arată parola">
                  <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="19" />
                </button>
              </div>
            </div>
          </div>

          <button class="forgot" [disabled]="loading()" (click)="resetPassword()">Ai uitat parola?</button>

          <div style="margin: 48px 0 16px">
            <app-button label="Intră în cont" [height]="54" accent="var(--label)" [loading]="loading()" [disabled]="loading()" (pressed)="signIn()" />
          </div>

          <div class="divider"><span>sau</span></div>

          <button class="google-btn pressable" [disabled]="loading()" (click)="signInWithGoogle()">
            <span [innerHTML]="googleLogo"></span>
            Continuă cu Google
          </button>

          <div class="switch-link" (click)="goRegister()">
            Nu ai cont? <b>Creează unul</b>
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
    <div class="landing-bg">
      <div class="wrap">
        <div class="panel">
          <button class="back-row" (click)="back()" aria-label="Înapoi">
            <app-icon name="chevron-back" [size]="20" />
            <span>Înapoi</span>
          </button>
          
          <div class="heading">Creează cont</div>
          <div class="sub">Îți salvăm progresul și sesiunile.</div>

          <div class="fields">
            <div class="app-input">
              <label>Email</label>
              <div class="input-row">
                <input type="email" [(ngModel)]="email" autocomplete="email" />
              </div>
            </div>
            <div class="app-input">
              <label>Parolă</label>
              <div class="input-row">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  autocomplete="new-password"
                />
                <button class="suffix-btn" (click)="showPassword.set(!showPassword())" aria-label="Arată parola">
                  <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="19" />
                </button>
              </div>
            </div>
            <div class="app-input">
              <label>Confirmă parola</label>
              <div class="input-row">
                <input
                  [type]="showConfirm() ? 'text' : 'password'"
                  [(ngModel)]="confirm"
                  autocomplete="new-password"
                />
                <button class="suffix-btn" (click)="showConfirm.set(!showConfirm())" aria-label="Arată parola">
                  <app-icon [name]="showConfirm() ? 'eye-off' : 'eye'" [size]="19" />
                </button>
              </div>
            </div>
          </div>

          <div style="margin: 48px 0 16px">
            <app-button label="Creează cont" [height]="54" accent="var(--label)" [loading]="loading()" [disabled]="loading()" (pressed)="register()" />
          </div>

          <div class="divider"><span>sau</span></div>

          <button class="google-btn pressable" [disabled]="loading()" (click)="signInWithGoogle()">
            <span [innerHTML]="googleLogo"></span>
            Continuă cu Google
          </button>

          <div class="switch-link" (click)="goLogin()">
            Ai deja cont? <b>Intră în cont</b>
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
