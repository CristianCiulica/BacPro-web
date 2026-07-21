/**
 * Dashboard BacPro — redesign „Apple HIG" (Fitness / Health / Sonoma):
 * card-hero cu salut + streak + inel de obiectiv săptămânal + acțiune rapidă,
 * grilă de statistici cu numere animate (count-up), carduri de materii cu bară
 * de progres animată. Paletă minimală (neutru + albastru Apple), colțuri 24px,
 * umbre soft, hover lift, fade-in etapizat.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { profileByName } from '../../core/models/catalog';
import { progressFromSessions } from '../../core/models/profile-data';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { CountdownService } from '../../core/services/countdown.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { AppButtonComponent, CountComponent, IconComponent } from '../../ui/ui';
import { ShellComponent } from '../shell/shell';
import { slug as slugify } from '../subjects/subject-routing';

const WEEKLY_GOAL = 5;
const RING_C = 326.7; // 2πr, r = 52

const DAYS_RO = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, CountComponent, IconComponent],
  template: `
    <header class="bar">
      <button class="round-btn pressable" (click)="shell?.openMenu()" aria-label="Meniu">
        <app-icon name="menu" [size]="19" />
      </button>
      <div class="bar-title">BacPro</div>
      <div class="round-spacer"></div>
    </header>

    <div class="page-scroll wide-page">
      <div class="page-pad wrap">
        <!-- HERO -->
        <section class="hero card rise">
          <div class="hero-l">
            <div class="t-section date">{{ todayLabel() }}</div>
            <h1 class="hero-greet">Bine ai revenit,<br />{{ firstName() }}</h1>

            <div class="streak-chip">
              <app-icon name="flame" [size]="15" />
              <span class="streak-n"><app-count [value]="progress().streakDays" /></span>
              <span>{{ progress().streakDays === 1 ? 'zi' : 'zile' }} la rând</span>
            </div>

            <app-button
              label="Continuă învățarea"
              icon="play-fill"
              [expanded]="false"
              class="inline-host hero-cta"
              (pressed)="continueLearning()"
            />
          </div>

          <div class="hero-r">
            <div class="ring-wrap">
              <svg viewBox="0 0 120 120" class="ring">
                <circle class="ring-track" cx="60" cy="60" r="52" />
                <circle
                  class="ring-fill"
                  cx="60" cy="60" r="52"
                  [attr.stroke-dashoffset]="ringOffset()"
                />
              </svg>
              <div class="ring-center">
                <div class="ring-val">
                  <app-count [value]="weeklySolved()" /><span class="ring-goal">/{{ weeklyGoal }}</span>
                </div>
                <div class="ring-cap">Obiectiv</div>
              </div>
            </div>
            <div class="hero-week-msg">
              {{ goalDone() ? 'Obiectiv atins. Impecabil.' : 'subiecte săptămâna asta' }}
            </div>
          </div>
        </section>

        <!-- STATISTICI -->
        <div class="stats rise rise-1">
          @for (s of stats(); track s.label) {
            <div class="stat card">
              <span class="stat-icon"><app-icon [name]="s.icon" [size]="16" /></span>
              <div class="stat-grow"></div>
              <div class="stat-val">
                @if (s.count !== null) {
                  <app-count [value]="s.count" [decimals]="s.decimals" />{{ s.suffix }}
                } @else {
                  {{ s.text }}
                }
              </div>
              <div class="stat-title">{{ s.label }}</div>
              <div class="stat-desc">{{ s.desc }}</div>
            </div>
          }
        </div>

        <!-- MATERII -->
        <div class="rise rise-2">
          <div class="subj-head">
            <span class="t-section">Materiile tale</span>
            <button class="profile-chip pressable" (click)="go('/user-profile')">
              {{ selectedProfile().name }}
              <app-icon name="chevron-right" [size]="11" />
            </button>
          </div>
          <div class="subj-grid">
            @for (s of subjectStats(); track s.title) {
              <button class="subj-card card" (click)="openSubject(s.title)">
                <div class="subj-top">
                  <span class="subj-icon"><app-icon [name]="s.icon" [size]="18" /></span>
                  <span class="subj-pct"><app-count [value]="s.pct" />%</span>
                </div>
                <div class="subj-name">{{ s.title }}</div>
                <div class="subj-bar">
                  <div class="subj-fill" [style.width.%]="mounted() ? s.pct : 0"></div>
                </div>
                <div class="subj-foot">
                  <span class="subj-meta">{{ s.count }} {{ s.count === 1 ? 'subiect' : 'subiecte' }}</span>
                  <span class="subj-cont">Continuă <app-icon name="chevron-right" [size]="12" /></span>
                </div>
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
      /* bara de sus (mobil) */
      .bar {
        position: fixed;
        top: 0; left: var(--sidebar-w, 0); right: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        height: calc(58px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) var(--x3) 0;
        background: rgba(245, 245, 247, 0.7);
        -webkit-backdrop-filter: blur(32px) saturate(1.6);
        backdrop-filter: blur(32px) saturate(1.6);
        border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
      }
      @media (min-width: 960px) {
        .bar { display: none; }
        .wrap { padding-top: var(--x6) !important; }
      }
      .bar-title { flex: 1; text-align: center; font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -0.4px; }
      .round-btn {
        width: 38px; height: 38px;
        border-radius: 50%;
        border: 0.5px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.9);
        box-shadow: var(--shadow-soft);
        color: var(--label-2);
        display: flex; align-items: center; justify-content: center;
        flex: none; margin-left: var(--x1);
      }
      .round-spacer { width: 42px; flex: none; }
      :host-context(.dark) .bar { background: rgba(10, 12, 18, 0.62); border-bottom-color: rgba(255, 255, 255, 0.07); }
      :host-context(.dark) .round-btn { background: rgba(30, 34, 46, 0.85); border-color: rgba(255, 255, 255, 0.1); }

      .wrap { padding-top: var(--x5); display: flex; flex-direction: column; gap: var(--x4); }

      /* card de bază — colțuri 24, umbră soft, hover lift */
      .card {
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
        transition: transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease);
      }
      @media (hover: hover) {
        .subj-card:hover, .stat:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-floating), inset 0 0 0 0.5px var(--hairline);
        }
      }

      /* ---------------- HERO ---------------- */
      .hero {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: var(--x5);
        align-items: center;
        padding: var(--x6);
      }
      .hero-l { display: flex; flex-direction: column; align-items: flex-start; }
      .date { letter-spacing: 1px; }
      .hero-greet {
        margin: 6px 0 0;
        font-family: var(--font-display);
        font-size: clamp(26px, 4vw, 34px);
        font-weight: 800;
        letter-spacing: -0.9px;
        line-height: 1.08;
      }
      .streak-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: var(--x4);
        padding: 7px 13px;
        border-radius: var(--r-pill);
        background: var(--fill);
        color: var(--label-2);
        font-size: 13.5px;
        font-weight: 500;
      }
      .streak-n { font-weight: 800; color: var(--label); font-variant-numeric: tabular-nums; }
      .hero-cta { margin-top: var(--x5); }
      .hero-r { display: flex; flex-direction: column; align-items: center; gap: var(--x3); }
      .ring-wrap { position: relative; width: 150px; height: 150px; }
      .ring { width: 150px; height: 150px; transform: rotate(-90deg); }
      .ring-track { fill: none; stroke: var(--fill); stroke-width: 12; }
      .ring-fill {
        fill: none;
        stroke: var(--blue);
        stroke-width: 12;
        stroke-linecap: round;
        stroke-dasharray: ${RING_C};
        transition: stroke-dashoffset 900ms var(--ease);
      }
      .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .ring-val { font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -1px; }
      .ring-goal { color: var(--label-3); font-size: 18px; font-weight: 700; }
      .ring-cap { font-size: 10px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--label-3); margin-top: 1px; }
      .hero-week-msg { font-size: 12.5px; color: var(--label-2); text-align: center; max-width: 150px; }

      /* ---------------- STATISTICI ---------------- */
      .stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--x3);
      }
      @media (min-width: 620px) {
        .stats { grid-template-columns: repeat(3, 1fr); }
      }
      .stat {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: var(--x4);
        min-height: 132px;
      }
      .stat-icon {
        width: 32px; height: 32px;
        border-radius: 10px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex; align-items: center; justify-content: center;
      }
      .stat-grow { flex: 1; min-height: var(--x3); }
      .stat-val { font-family: var(--font-display); font-size: 27px; font-weight: 800; letter-spacing: -0.9px; line-height: 1; font-variant-numeric: tabular-nums; }
      .stat-title { margin-top: 5px; font-size: 13.5px; font-weight: 600; letter-spacing: -0.2px; }
      .stat-desc { margin-top: 1px; font-size: 12px; color: var(--label-3); }

      /* ---------------- MATERII ---------------- */
      .subj-head { display: flex; align-items: center; justify-content: space-between; margin: var(--x3) 0 var(--x3); padding: 0 2px; }
      .profile-chip {
        display: inline-flex; align-items: center; gap: 3px;
        border: none; padding: 6px 11px; border-radius: var(--r-pill);
        background: rgba(0, 122, 255, 0.1); color: var(--blue);
        font-size: 12.5px; font-weight: 600; letter-spacing: -0.1px;
      }
      .subj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: var(--x3); }
      .subj-card {
        display: flex; flex-direction: column;
        border: none; text-align: left; cursor: pointer;
        padding: var(--x4);
      }
      .subj-top { display: flex; align-items: center; justify-content: space-between; }
      .subj-icon {
        width: 40px; height: 40px;
        border-radius: 12px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex; align-items: center; justify-content: center;
      }
      .subj-pct { font-family: var(--font-display); font-size: 16px; font-weight: 700; letter-spacing: -0.4px; color: var(--label); }
      .subj-name { margin-top: var(--x3); font-size: 15.5px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.2; }
      .subj-bar { margin-top: var(--x3); height: 6px; border-radius: var(--r-pill); background: var(--fill); overflow: hidden; }
      .subj-fill {
        height: 100%; min-width: 6px; border-radius: var(--r-pill);
        background: var(--blue);
        transition: width 900ms var(--ease);
      }
      .subj-foot { display: flex; align-items: center; justify-content: space-between; margin-top: var(--x3); }
      .subj-meta { font-size: 12.5px; color: var(--label-3); }
      .subj-cont { display: inline-flex; align-items: center; gap: 1px; font-size: 12.5px; font-weight: 600; color: var(--blue); }

      /* responsive hero */
      @media (max-width: 620px) {
        .hero { grid-template-columns: 1fr; }
        .hero-r { flex-direction: row; justify-content: space-between; width: 100%; margin-top: var(--x4); }
        .hero-week-msg { text-align: left; }
      }
    `,
  ],
})
export class HomeComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private countdown = inject(CountdownService);
  private router = inject(Router);
  private settings = inject(AppSettingsService);
  readonly shell = inject(ShellComponent, { optional: true });

  readonly weeklyGoal = WEEKLY_GOAL;
  readonly mounted = signal(false);

  constructor() {
    // declanșează animația barelor de progres după montare
    setTimeout(() => this.mounted.set(true), 70);
  }

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
    const weekday = (day.getDay() + 6) % 7;
    const weekStart = new Date(day.getTime() - weekday * 86400000);
    return this.sessions().filter((s) => s.completedAt.getTime() >= weekStart.getTime()).length;
  });
  readonly goalPct = computed(() => Math.min(Math.max(this.weeklySolved() / WEEKLY_GOAL, 0), 1));
  readonly goalDone = computed(() => this.weeklySolved() >= WEEKLY_GOAL);
  readonly ringOffset = computed(() => (this.mounted() ? RING_C * (1 - this.goalPct()) : RING_C));

  readonly selectedProfile = computed(() => {
    const user = this.auth.user();
    const profile = user ? this.firestore.watchProfile(user)() : null;
    return profileByName(profile?.selectedProfile);
  });

  readonly subjectStats = computed(() => {
    const counts = new Map<string, number>();
    for (const s of this.sessions()) counts.set(s.subjectName, (counts.get(s.subjectName) ?? 0) + 1);
    return this.selectedProfile().subjects.map((sub) => {
      const count = counts.get(sub.title) ?? 0;
      return { ...sub, count, pct: Math.round(Math.min(count / 10, 1) * 100) };
    });
  });

  readonly stats = computed(() => {
    const p = this.progress();
    const m = this.countdown.model();
    const examYear = m.examDate.getFullYear();
    return [
      { icon: 'doc-check', label: 'Subiecte', desc: 'rezolvate în total', count: p.solvedCount, decimals: 0, suffix: '', text: '' },
      { icon: 'flame', label: 'Obiectiv', desc: 'săptămâna asta', count: this.weeklySolved(), decimals: 0, suffix: '/' + WEEKLY_GOAL, text: '' },
      { icon: 'clock', label: 'Timp studiu', desc: 'total acumulat', count: null, decimals: 0, suffix: '', text: this.formatStudyTime(p.totalStudySeconds) },
      { icon: 'chart-bar', label: 'Streak', desc: p.streakDays === 1 ? 'zi la rând' : 'zile la rând', count: p.streakDays, decimals: 0, suffix: '', text: '' },
      p.averageGrade === 0
        ? { icon: 'star', label: 'Medie', desc: 'estimată', count: null, decimals: 0, suffix: '', text: '–' }
        : { icon: 'star', label: 'Medie', desc: 'estimată', count: p.averageGrade, decimals: 2, suffix: '', text: '' },
      { icon: 'calendar', label: 'Până la BAC', desc: 'Iunie ' + examYear, count: m.daysRemaining, decimals: 0, suffix: ' zile', text: '' },
    ];
  });

  formatStudyTime(seconds: number): string {
    const h = Math.trunc(seconds / 3600);
    const min = Math.trunc((seconds % 3600) / 60);
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  }

  continueLearning(): void {
    this.settings.medium();
    const last = this.sessions()[0];
    if (last) {
      this.router.navigate([
        '/subject',
        slugify(this.selectedProfile().name),
        slugify(last.subjectName),
        last.year,
        slugify(last.sessionName),
      ]);
    } else {
      this.router.navigateByUrl('/random');
    }
  }

  openSubject(subjectTitle: string): void {
    this.router.navigate(['/subject', slugify(this.selectedProfile().name), slugify(subjectTitle)]);
  }

  go(route: string): void {
    this.router.navigateByUrl(route);
  }
}
