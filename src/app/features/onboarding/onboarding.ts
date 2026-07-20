/**
 * Onboarding în 4 pași — port al lib/src/screens/onboarding_screen.dart:
 * nume → profil → slider notă → estimare plan (aceeași matematică).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { appProfiles } from '../../core/models/catalog';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { CountdownService } from '../../core/services/countdown.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  AppButtonComponent,
  DialogService,
  IconComponent,
  TintedIconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, IconComponent, TintedIconComponent],
  template: `
    <div class="screen">
      <header class="head">
        <div class="backslot">
          @if (page() > 0) {
            <button class="round-btn pressable" (click)="back()" aria-label="Înapoi">
              <app-icon name="chevron-back" [size]="20" />
            </button>
          }
        </div>
        <div class="dots">
          @for (i of [0, 1, 2, 3]; track i) {
            <div class="dot" [class.active]="i === page()" [class.done]="i <= page()"></div>
          }
        </div>
        <div class="backslot"></div>
      </header>

      <main class="body">
        @switch (page()) {
          @case (0) {
            <div class="pad welcome">
              <img class="hero" src="assets/images/login_hero.png" alt="BacPro" />
              <h2 class="ptitle center">Bine ai venit în BacPro</h2>
              <p class="t-subhead center intro">Hai să te cunoaștem. Cum te numești?</p>
              <div class="app-input">
                <app-icon name="person" [size]="20" />
                <input type="text" placeholder="Numele tău" [(ngModel)]="name" autocomplete="name" />
              </div>
            </div>
          }
          @case (1) {
            <div class="pad">
              <h2 class="ptitle">Ce profil ai?</h2>
              <p class="t-subhead">Îți arătăm doar materiile din programa ta.</p>
              <div class="profiles">
                @for (profile of profiles; track profile.name) {
                  <div
                    class="option pressable"
                    [class.selected]="selectedProfile() === profile.name"
                    (click)="selectProfile(profile.name)"
                  >
                    <app-tinted-icon [icon]="profile.icon" [color]="profile.accentColor" />
                    <div class="texts">
                      <div class="t-headline">{{ profile.name }}</div>
                      <div class="t-subhead">{{ profile.description }}</div>
                    </div>
                    <app-icon
                      [name]="selectedProfile() === profile.name ? 'check-circle-fill' : 'circle'"
                      [size]="24"
                      [style.color]="selectedProfile() === profile.name ? 'var(--blue)' : 'var(--label-3)'"
                    />
                  </div>
                }
              </div>
            </div>
          }
          @case (2) {
            <div class="pad">
              <h2 class="ptitle">Ce notă ai lua dacă ai da bacul mâine?</h2>
              <p class="t-subhead">
                Estimează media pe care ai obține-o la Bacalaureat acum. O folosim pentru un plan realist.
              </p>
              <div class="grade-value" [style.color]="gradeColor()">{{ grade().toFixed(1) }}</div>
              <input
                class="app-slider"
                type="range"
                min="1"
                max="10"
                step="0.5"
                [ngModel]="grade()"
                (ngModelChange)="setGrade($event)"
                [style.--track-color]="gradeColor()"
                [style.--pct.%]="((grade() - 1) / 9) * 100"
              />
              <div class="scale">
                <span class="t-caption">1</span>
                <span class="t-caption">10</span>
              </div>
            </div>
          }
          @case (3) {
            <div class="pad">
              <h2 class="ptitle">Planul tău</h2>
              <p class="t-subhead">Profil {{ selectedProfile() ?? profiles[0].name }}</p>

              <div class="floating-card estimate">
                <div class="pills">
                  <div class="gpill">
                    <span class="t-caption">Acum</span>
                    <span class="gval" style="color: var(--label-2)">{{ grade().toFixed(1) }}</span>
                  </div>
                  <app-icon name="arrow-right" [size]="24" style="color: var(--label-3)" />
                  <div class="gpill">
                    <span class="t-caption">Țintă</span>
                    <span class="gval" style="color: var(--green)">{{ targetGrade().toFixed(1) }}</span>
                  </div>
                </div>
                <div class="gain-box">
                  <div class="gain-head">
                    <app-icon name="arrow-up-right-circle-fill" [size]="20" style="color: var(--green)" />
                    <span class="t-headline" style="color: var(--green)">
                      {{ nearMax() ? 'Aproape de maxim' : '+' + gainLabel() + ' puncte posibile' }}
                    </span>
                  </div>
                  <p class="t-subhead gain-text">
                    {{
                      nearMax()
                        ? 'Ești deja aproape de nota maximă. Cu recapitulări constante îți poți menține și consolida media.'
                        : 'Dacă lucrezi constant ~30–45 min pe zi, îți poți crește media cu ' +
                          gainLabel() + ' puncte în aproximativ ' + weeksNeeded() + ' săptămâni.'
                    }}
                  </p>
                </div>
              </div>

              <div class="floating-card time-card">
                <app-tinted-icon
                  [icon]="enoughTime() ? 'check-seal-fill' : 'bolt-fill'"
                  [color]="enoughTime() ? '#007AFF' : '#FF9500'"
                />
                <span class="t-subhead time-text">
                  {{
                    enoughTime()
                      ? 'Ai destul timp până la examen (' + weeksLeft() + ' săptămâni). Începem?'
                      : 'Mai sunt ' + weeksLeft() + ' săptămâni. Cu un ritm intensiv, tot poți crește semnificativ nota.'
                  }}
                </span>
              </div>
            </div>
          }
        }
      </main>

      <footer class="foot">
        <app-button
          [label]="page() === 3 ? 'Intră în BacPro' : 'Continuă'"
          [icon]="page() === 3 ? 'check' : null"
          [loading]="saving()"
          [disabled]="!canAdvance() || saving()"
          (pressed)="next()"
        />
      </footer>
    </div>
  `,
  styles: [
    `
      .screen { min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg); }
      .head {
        display: flex;
        align-items: center;
        padding: calc(var(--x3) + env(safe-area-inset-top, 0px)) var(--x4) var(--x2);
      }
      .backslot { width: 40px; flex: none; }
      .round-btn {
        width: 38px; height: 38px;
        border-radius: 50%;
        border: 0.5px solid var(--separator);
        background: rgba(255, 255, 255, 0.85);
        box-shadow: var(--shadow-soft);
        color: var(--blue);
        display: flex; align-items: center; justify-content: center;
      }
      .dots { flex: 1; display: flex; justify-content: center; gap: 6px; }
      .dot {
        width: 7px; height: 7px;
        border-radius: var(--r-pill);
        background: var(--fill-secondary);
        transition: width var(--dur-base) var(--ease), background var(--dur-base) var(--ease);
      }
      .dot.done { background: var(--blue); }
      .dot.active { width: 22px; }
      .body { flex: 1; overflow-y: auto; }
      .pad { padding: var(--x3) var(--page) var(--x5); }
      .welcome { padding: var(--x8) var(--x6) var(--x5); }
      .hero {
        display: block;
        width: 96px; height: 96px;
        margin: 0 auto;
        object-fit: cover;
        border-radius: var(--r-xl);
        box-shadow: var(--shadow-floating);
      }
      .ptitle {
        margin: var(--x6) 0 4px;
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
        color: var(--label);
      }
      .pad:not(.welcome) .ptitle { margin-top: 0; }
      .center { text-align: center; }
      .welcome .ptitle { font-size: 28px; letter-spacing: -0.6px; }
      .intro { font-size: 15px; line-height: 1.45; margin: var(--x3) 0 var(--x6); }
      .profiles { margin-top: var(--x4); display: flex; flex-direction: column; gap: var(--x3); }
      .option {
        display: flex;
        align-items: center;
        gap: var(--x3);
        background: var(--surface);
        border: 1px solid var(--separator);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft);
        padding: var(--x4);
        transition: border-color var(--dur-fast) ease-out;
      }
      .option.selected { border: 1.6px solid var(--blue); }
      .option .texts { flex: 1; min-width: 0; }
      .grade-value {
        text-align: center;
        font-family: var(--font-display);
        font-size: 72px;
        font-weight: 700;
        letter-spacing: -2px;
        margin: var(--x6) 0 var(--x4);
      }
      .scale { display: flex; justify-content: space-between; }
      .estimate { margin-top: var(--x5); border-radius: var(--r-xl); }
      .pills { display: flex; align-items: center; justify-content: space-evenly; }
      .gpill { display: flex; flex-direction: column; align-items: center; gap: var(--x2); }
      .gval { font-family: var(--font-display); font-size: 40px; font-weight: 700; letter-spacing: -1px; }
      .gain-box {
        margin-top: var(--x4);
        background: rgba(52, 199, 89, 0.13);
        border-radius: var(--r-md);
        padding: var(--x4);
      }
      .gain-head { display: flex; align-items: center; gap: var(--x2); }
      .gain-text { margin: var(--x2) 0 0; color: var(--label); line-height: 1.4; }
      .time-card { margin-top: var(--x4); border-radius: var(--r-md); padding: var(--x4); display: flex; align-items: center; gap: var(--x3); }
      .time-text { color: var(--label); }
      .foot { padding: var(--x3) var(--page) calc(var(--x5) + env(safe-area-inset-bottom, 0px)); }
    `,
  ],
})
export class OnboardingComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private countdown = inject(CountdownService);
  private router = inject(Router);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  readonly profiles = appProfiles;
  readonly page = signal(0);
  readonly selectedProfile = signal<string | null>(null);
  readonly grade = signal(6.0);
  readonly saving = signal(false);
  name = '';

  readonly gradeColor = computed(() => {
    const g = this.grade();
    return g >= 8.5 ? 'var(--green)' : g >= 5 ? 'var(--orange)' : 'var(--red)';
  });

  /* Matematica estimării — identică cu onboarding_screen.dart. */
  private desiredGain = computed(() =>
    this.grade() >= 8 ? 2.0 : this.grade() >= 6 ? 2.5 : 3.0,
  );
  readonly gain = computed(() => {
    const headroom = 10 - this.grade();
    const capped = Math.min(headroom, this.desiredGain());
    return capped < 0 ? 0 : capped;
  });
  readonly targetGrade = computed(() =>
    Math.min(Math.max(this.grade() + this.gain(), 1), 10),
  );
  readonly weeksNeeded = computed(() =>
    this.grade() < 5 ? 12 : this.grade() < 7 ? 9 : 6,
  );
  readonly nearMax = computed(() => this.gain() < 0.75);
  readonly gainLabel = computed(() => {
    const g = this.gain();
    return g % 1 === 0 ? g.toFixed(0) : g.toFixed(1);
  });
  readonly weeksLeft = computed(() =>
    Math.ceil(this.countdown.model().daysRemaining / 7),
  );
  readonly enoughTime = computed(() => this.weeksLeft() >= this.weeksNeeded());

  canAdvance(): boolean {
    if (this.page() === 0) return this.name.trim() !== '';
    if (this.page() === 1) return this.selectedProfile() !== null;
    return true;
  }

  selectProfile(name: string): void {
    this.settings.selection();
    this.selectedProfile.set(name);
  }

  setGrade(value: number): void {
    this.settings.selection();
    this.grade.set(Number(value));
  }

  back(): void {
    if (this.page() === 0) return;
    this.settings.selection();
    this.page.set(this.page() - 1);
  }

  next(): void {
    if (!this.canAdvance()) return;
    if (this.page() >= 3) {
      this.finish();
      return;
    }
    this.settings.selection();
    this.page.set(this.page() + 1);
  }

  private async finish(): Promise<void> {
    this.saving.set(true);
    this.settings.heavy();
    const name = this.name.trim();
    try {
      await this.auth.updateDisplayName(name);
      const user = this.auth.currentUser;
      if (!user) throw new Error('no-user');
      await this.firestore.completeOnboarding(
        user,
        name,
        this.selectedProfile() ?? this.profiles[0].name,
        this.grade(),
      );
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch {
      this.saving.set(false);
      await this.dialogs.alert(
        'Nu am putut salva',
        'Verifică conexiunea la internet și încearcă din nou.',
      );
    }
  }
}
