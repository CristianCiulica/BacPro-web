/**
 * Dashboard-ul BacPro — redesign "Cupertino".
 * Ierarhie: dată + salut → hero Countdown → metrici (Subiecte, Obiectiv cu
 * 5 segmente, ring medie) → grila materiilor. Carduri cu umbre stratificate,
 * intrare în scenă etapizată, micro-interacțiuni.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { profileByName } from '../../core/models/catalog';
import { progressFromSessions } from '../../core/models/profile-data';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { IconComponent } from '../../ui/ui';
import { ShellComponent } from '../shell/shell';
import { slug as slugify } from '../subjects/subject-routing';
import { CountdownCardComponent } from './countdown-card';

const WEEKLY_GOAL = 5; // subiecte pe săptămână

const DAYS_RO = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CountdownCardComponent, IconComponent],
  template: `
    <header class="bar">
      <button class="round-btn pressable" (click)="shell?.openMenu()" aria-label="Meniu">
        <app-icon name="menu" [size]="19" />
      </button>
      <div class="bar-title">BacPro</div>
      <div class="round-spacer"></div>
    </header>

    <div class="page-scroll wide-page">
      <div class="page-pad overview">
        <div class="t-section date rise">{{ todayLabel() }}</div>
        <h1 class="t-large-title htitle rise">Bine ai revenit, {{ firstName() }}</h1>

        <div class="squares rise rise-1" style="margin-top: var(--x5)">
          <!-- Subiecte rezolvate -->
          <div class="card square">
            <div class="sq-head">
              <span class="sq-title">Subiecte</span>
            </div>
            <div class="sq-spacer"></div>
            <div class="sq-value">{{ progress().solvedCount }}</div>
            <div class="sq-unit">rezolvate în total</div>
          </div>

          <!-- Obiectiv săptămânal — 5 segmente -->
          <div class="card square">
            <div class="sq-head">
              <span class="sq-title">Obiectiv</span>
            </div>
            <div class="sq-spacer"></div>
            <div class="segments" role="img" [attr.aria-label]="weeklySolved() + ' din ' + weeklyGoal + ' subiecte'">
              @for (i of goalSlots; track i) {
                <span
                  class="seg"
                  [class.on]="i < weeklySolved()"
                  [style.background]="i < weeklySolved() ? (goalDone() ? 'var(--green)' : 'var(--blue)') : ''"
                ></span>
              }
            </div>
            <div class="sq-value goal-count">
              {{ weeklySolved() }}<span class="goal-of">/{{ weeklyGoal }}</span>
            </div>
            <div class="sq-unit">săptămâna asta</div>
          </div>
        </div>

        <div class="mid">
        <!-- Overview: staturi + ring medie -->
        <div class="card wide rise rise-2">
          <div class="legend">
            <div class="litem">
              <span class="ldot" style="background: var(--blue)"></span>
              <div>
                <div class="lval">{{ formatStudyTime(progress().totalStudySeconds) }}</div>
                <div class="t-caption">Timp studiu</div>
              </div>
            </div>
            <div class="litem">
              <span class="ldot" style="background: var(--orange)"></span>
              <div>
                <div class="lval">{{ progress().streakDays }} {{ progress().streakDays === 1 ? 'zi' : 'zile' }}</div>
                <div class="t-caption">Streak curent</div>
              </div>
            </div>
            <div class="litem">
              <span class="ldot" style="background: var(--green)"></span>
              <div>
                <div class="lval">{{ latestGrade() }}</div>
                <div class="t-caption">Ultima notă</div>
              </div>
            </div>
          </div>
          <div class="ring-box">
            <svg width="116" height="116" viewBox="0 0 116 116">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#007AFF" />
                  <stop offset="100%" stop-color="#5856D6" />
                </linearGradient>
              </defs>
              <circle cx="58" cy="58" r="50" fill="none" stroke="rgba(0, 122, 255, 0.1)" stroke-width="11" />
              <circle
                cx="58" cy="58" r="50"
                fill="none"
                stroke="url(#ringGrad)"
                stroke-width="11"
                stroke-linecap="round"
                stroke-dasharray="314.2"
                [attr.stroke-dashoffset]="ringOffset()"
                transform="rotate(-90 58 58)"
                style="transition: stroke-dashoffset 900ms var(--ease)"
              />
            </svg>
            <div class="ring-center">
              <div class="rval">{{ averageLabel() }}</div>
              <div class="rlabel">Medie</div>
            </div>
          </div>
        </div>

        <!-- Countdown — compact, discret -->
        <div class="cd rise rise-3 pressable" (click)="goExamDate()">
          <app-countdown-card />
        </div>
        </div>

        <!-- Materiile — grilă de tile-uri -->
        <div class="rise rise-4">
          <div class="subj-head">
            <span class="t-section">Materiile tale</span>
            <button class="profile-chip pressable" (click)="go('/user-profile')">
              {{ selectedProfile().name }}
              <app-icon name="chevron-right" [size]="11" />
            </button>
          </div>
          <div class="subj-grid">
            @for (subject of selectedProfile().subjects; track subject.title) {
              <button class="tile pressable" (click)="openSubject(subject.title)">
                <span class="tile-icon"><app-icon [name]="subject.icon" [size]="21" /></span>
                <span class="tile-title">{{ subject.title }}</span>
                <span class="tile-sub">2020 – 2025</span>
              </button>
            }
          </div>
        </div>
      </div>

      <div style="height: var(--tab-clearance)"></div>
    </div>
  `,
  styles: [
    `
      .bar {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        height: calc(58px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) var(--x3) 0;
        background: rgba(244, 246, 251, 0.62);
        -webkit-backdrop-filter: blur(32px) saturate(1.6);
        backdrop-filter: blur(32px) saturate(1.6);
        border-bottom: 0.5px solid rgba(229, 234, 243, 0.55);
      }
      .bar-title {
        flex: 1;
        text-align: center;
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 800;
        letter-spacing: -0.4px;
      }
      .round-btn {
        width: 38px; height: 38px;
        border-radius: 50%;
        border: 0.5px solid rgba(229, 234, 243, 0.8);
        background: rgba(255, 255, 255, 0.88);
        box-shadow: var(--shadow-soft);
        color: var(--label-2);
        display: flex; align-items: center; justify-content: center;
        flex: none;
        margin-left: var(--x1);
      }
      .round-spacer { width: 42px; flex: none; }

      .overview { padding-top: var(--x5); }
      .date { letter-spacing: 1px; }
      .htitle { margin: 4px 0 0; }

      .card {
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
      }

      .squares { display: flex; gap: var(--x3); margin-top: var(--x3); align-items: stretch; }
      .square {
        flex: 1;
        min-width: 0;
        padding: var(--x4) var(--x4) 15px;
        display: flex;
        flex-direction: column;
      }
      .sq-head { display: flex; align-items: center; justify-content: space-between; }
      .sq-title { font-size: 14px; font-weight: 600; letter-spacing: -0.2px; color: var(--label-2); }
      .sq-spacer { flex: 1; min-height: var(--x4); }
      .sq-value {
        font-family: var(--font-display);
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -1.2px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .goal-of { font-size: 19px; font-weight: 700; color: var(--label-3); letter-spacing: -0.4px; }
      .sq-unit { margin-top: 4px; font-size: 12.5px; color: var(--label-2); }
      .segments { display: flex; gap: 5px; margin-bottom: var(--x3); }
      .seg {
        flex: 1;
        height: 7px;
        border-radius: var(--r-pill);
        background: var(--fill-secondary);
        transition: background var(--dur-base) var(--ease);
      }

      .mid { display: flex; flex-direction: column; }
      .cd { margin-top: var(--x3); }
      .wide {
        margin-top: var(--x3);
        padding: var(--x5);
        display: flex;
        align-items: center;
        gap: var(--x4);
      }

      /* Desktop: overview + countdown pe două coloane, materiile pe trei */
      @media (min-width: 760px) {
        .mid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: var(--x3);
          align-items: stretch;
          margin-top: var(--x3);
        }
        .mid .wide, .mid .cd { margin-top: 0; }
        .cd { display: flex; }
        .cd ::ng-deep app-countdown-card { display: flex; width: 100%; }
        .cd ::ng-deep app-countdown-card .card { height: 100%; }
      }
      .legend { flex: 1; display: flex; flex-direction: column; gap: 15px; min-width: 0; }
      .litem { display: flex; gap: var(--x3); align-items: flex-start; }
      .ldot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex: none; }
      .lval {
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 700;
        letter-spacing: -0.45px;
        font-variant-numeric: tabular-nums;
      }
      .ring-box { position: relative; width: 116px; height: 116px; flex: none; }
      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .rval {
        font-family: var(--font-display);
        font-size: 27px;
        font-weight: 800;
        letter-spacing: -0.8px;
        font-variant-numeric: tabular-nums;
      }
      .rlabel {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: var(--label-3);
        margin-top: 1px;
      }

      .subj-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: var(--x6) 0 var(--x3);
        padding: 0 2px;
      }
      .profile-chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        border: none;
        padding: 6px 11px;
        border-radius: var(--r-pill);
        background: rgba(0, 122, 255, 0.1);
        color: var(--blue);
        font-size: 12.5px;
        font-weight: 600;
        letter-spacing: -0.1px;
      }
      .subj-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--x3);
      }
      .tile {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        text-align: left;
        border: none;
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
        padding: var(--x4);
      }
      @media (hover: hover) {
        .tile:hover { box-shadow: var(--shadow-floating), inset 0 0 0 0.5px var(--hairline); transform: translateY(-1px); }
      }
      .tile-icon {
        width: 42px; height: 42px;
        border-radius: 13px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--x3);
      }
      .tile-title {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.3px;
        color: var(--label);
        line-height: 1.2;
      }
      .tile-sub { font-size: 12px; color: var(--label-3); }

      @media (min-width: 760px) {
        .subj-grid { grid-template-columns: repeat(3, 1fr); }
      }
    `,
  ],
})
export class HomeComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);
  private settings = inject(AppSettingsService);
  readonly shell = inject(ShellComponent, { optional: true });

  readonly weeklyGoal = WEEKLY_GOAL;
  readonly goalSlots = [0, 1, 2, 3, 4];

  readonly firstName = computed(() => this.auth.displayName.split(' ')[0]);
  readonly todayLabel = computed(() => {
    const now = new Date();
    return `${DAYS_RO[now.getDay()]}, ${now.getDate()} ${MONTHS_RO[now.getMonth()]}`;
  });

  private sessions = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchSessions(user)() : [];
  });
  readonly progress = computed(() => progressFromSessions(this.sessions()));

  readonly weeklySolved = computed(() => {
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekday = (day.getDay() + 6) % 7; // luni = 0
    const weekStart = new Date(day.getTime() - weekday * 86400000);
    return this.sessions().filter((s) => s.completedAt.getTime() >= weekStart.getTime()).length;
  });
  readonly goalDone = computed(() => this.weeklySolved() >= WEEKLY_GOAL);

  readonly latestGrade = computed(() => {
    const list = this.sessions();
    return list.length === 0 ? '–' : list[0].estimatedGrade.toFixed(1);
  });
  readonly averageLabel = computed(() => {
    const avg = this.progress().averageGrade;
    return avg === 0 ? '–' : avg.toFixed(1);
  });
  readonly ringOffset = computed(() => {
    const pct = Math.min(Math.max(this.progress().averageGrade / 10, 0), 1);
    return 314.2 * (1 - pct);
  });

  readonly selectedProfile = computed(() => {
    const user = this.auth.user();
    const profile = user ? this.firestore.watchProfile(user)() : null;
    return profileByName(profile?.selectedProfile);
  });

  formatStudyTime(seconds: number): string {
    const h = Math.trunc(seconds / 3600);
    const m = Math.trunc((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  openSubject(subjectTitle: string): void {
    this.router.navigate([
      '/subject', slugify(this.selectedProfile().name), slugify(subjectTitle),
    ]);
  }

  go(route: string): void {
    this.router.navigateByUrl(route);
  }

  goExamDate(): void {
    this.settings.selection();
    this.router.navigateByUrl('/exam-date');
  }
}
