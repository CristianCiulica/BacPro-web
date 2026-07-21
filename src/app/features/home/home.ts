/**
 * Dashboard BacPro.
 * MOBIL (<960px): layout clasic — pătrate (Subiecte/Obiectiv), card overview cu
 * inel de medie, countdown compact, tile-uri de materii (fără bare de progres).
 * DESKTOP (≥960px): layout „Apple" — hero cu inel de obiectiv, grilă de
 * statistici compacte, carduri de materii cu progres. Inele/bare gri clean,
 * accent albastru doar pe acțiuni. Numere animate (count-up), fade-in.
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
import {
  AppButtonComponent,
  CountComponent,
  IconComponent,
  TintedIconComponent,
} from '../../ui/ui';
import { ShellComponent } from '../shell/shell';
import { slug as slugify } from '../subjects/subject-routing';

const WEEKLY_GOAL = 5;
const RING_C = 326.7; // 2πr, r = 52
const AVG_C = 314.2; // 2πr, r = 50

const DAYS_RO = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, CountComponent, IconComponent, TintedIconComponent],
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
        <!-- ============ MOBIL: layout clasic ============ -->
        <div class="top-m">
          <h1 class="t-large-title m-title rise">Activitatea ta</h1>
          <div class="t-subhead m-greet rise">Bine ai revenit, {{ firstName() }}!</div>

          <div class="squares rise rise-1">
            <div class="card square">
              <div class="sq-title">Subiecte</div>
              <div class="sq-spacer"></div>
              <div class="sq-value"><app-count [value]="progress().solvedCount" /></div>
              <div class="sq-unit">rezolvate în total</div>
            </div>
            <div class="card square">
              <div class="sq-title">Obiectiv</div>
              <div class="sq-spacer"></div>
              <div class="segments">
                @for (i of goalSlots; track i) {
                  <span class="seg" [class.on]="i < weeklySolved()"></span>
                }
              </div>
              <div class="sq-value">{{ weeklySolved() }}<span class="sq-of">/{{ weeklyGoal }}</span></div>
              <div class="sq-unit">săptămâna asta</div>
            </div>
          </div>

          <div class="card wide rise rise-2">
            <div class="legend">
              <div class="litem">
                <span class="ldot"></span>
                <div>
                  <div class="lval">{{ formatStudyTime(progress().totalStudySeconds) }}</div>
                  <div class="t-caption">Timp studiu</div>
                </div>
              </div>
              <div class="litem">
                <span class="ldot"></span>
                <div>
                  <div class="lval">{{ progress().streakDays }} {{ progress().streakDays === 1 ? 'zi' : 'zile' }}</div>
                  <div class="t-caption">Streak curent</div>
                </div>
              </div>
              <div class="litem">
                <span class="ldot"></span>
                <div>
                  <div class="lval">{{ latestGrade() }}</div>
                  <div class="t-caption">Ultima notă</div>
                </div>
              </div>
            </div>
            <div class="ring-box">
              <svg width="112" height="112" viewBox="0 0 116 116">
                <circle cx="58" cy="58" r="50" class="avg-track" />
                <circle cx="58" cy="58" r="50" class="avg-fill" [attr.stroke-dashoffset]="avgOffset()" />
              </svg>
              <div class="ring-center">
                <div class="rval">{{ averageLabel() }}</div>
                <div class="rcap">Medie</div>
              </div>
            </div>
          </div>

          <div class="cd card pressable rise rise-3" (click)="goExamDate()">
            <span class="cd-icon"><app-icon name="calendar" [size]="18" /></span>
            <div class="cd-texts">
              <div class="cd-line">
                <span class="cd-days"><app-count [value]="daysRemaining()" /></span>
                <span class="cd-unit">zile până la BAC</span>
              </div>
              <div class="cd-bar"><div class="cd-fill" [style.width.%]="cdPercent()"></div></div>
            </div>
            <span class="cd-when">Iunie {{ examYear() }} <app-icon name="chevron-right" [size]="12" /></span>
          </div>
        </div>

        <!-- ============ DESKTOP: hero + statistici ============ -->
        <div class="top-d">
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
                  <circle class="ring-fill" cx="60" cy="60" r="52" [attr.stroke-dashoffset]="ringOffset()" />
                </svg>
                <div class="ring-center">
                  <div class="ring-val"><app-count [value]="weeklySolved() " /><span class="ring-goal">/{{ weeklyGoal }}</span></div>
                  <div class="rcap">Obiectiv</div>
                </div>
              </div>
              <div class="hero-week-msg">{{ goalDone() ? 'Obiectiv atins. Impecabil.' : 'subiecte săptămâna asta' }}</div>
            </div>
          </section>

          <div class="stats rise rise-1">
            @for (s of stats(); track s.label) {
              <div class="stat card">
                <div class="stat-head">
                  <span class="stat-icon"><app-icon [name]="s.icon" [size]="15" /></span>
                  <span class="stat-title">{{ s.label }}</span>
                </div>
                <div class="stat-val">
                  @if (s.count !== null) {
                    <app-count [value]="s.count" [decimals]="s.decimals" />{{ s.suffix }}
                  } @else {
                    {{ s.text }}
                  }
                </div>
                <div class="stat-desc">{{ s.desc }}</div>
              </div>
            }
          </div>
        </div>

        <!-- ============ MATERII (comun, adaptiv) ============ -->
        <div class="rise rise-4">
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
                  <app-tinted-icon [icon]="s.icon" color="#8E98AC" [size]="42" />
                  <span class="subj-pct">{{ s.pct }}%</span>
                </div>
                <div class="subj-name">{{ s.title }}</div>
                <div class="subj-sub">2020 – 2025</div>
                <div class="subj-bar"><div class="subj-fill" [style.width.%]="mounted() ? s.pct : 0"></div></div>
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
        background: rgba(245, 245, 247, 0.55);
        -webkit-backdrop-filter: blur(28px) saturate(1.9);
        backdrop-filter: blur(28px) saturate(1.9);
        border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
      }
      .bar-title { flex: 1; text-align: center; font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -0.4px; }
      .round-btn {
        width: 38px; height: 38px; border-radius: 50%;
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

      /* card de bază */
      .card {
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
        transition: transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease);
      }

      /* comutare mobil/desktop */
      .top-d { display: none; }
      @media (min-width: 960px) {
        .top-m { display: none; }
        .top-d { display: flex; flex-direction: column; gap: var(--x4); }
        .bar { display: none; }
        .wrap { padding-top: var(--x6); }
      }

      /* ---------- MOBIL: pătrate + overview + countdown ---------- */
      .m-title { font-size: 30px; margin: 0; }
      .m-greet { font-size: 15px; margin-top: 2px; }
      .squares { display: flex; gap: var(--x3); margin-top: var(--x5); align-items: stretch; }
      .square { flex: 1; min-width: 0; padding: var(--x5); border-radius: var(--r-xl); display: flex; flex-direction: column; }
      .sq-title { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; }
      .sq-spacer { flex: 1; min-height: var(--x5); }
      .sq-value { font-family: var(--font-display); font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
      .sq-of { font-size: 19px; font-weight: 700; color: var(--label-3); letter-spacing: -0.4px; }
      .sq-unit { margin-top: 4px; font-size: 13px; color: var(--label-2); }
      .segments { display: flex; gap: 5px; margin-bottom: var(--x3); }
      .seg { flex: 1; height: 7px; border-radius: var(--r-pill); background: var(--fill-secondary); transition: background var(--dur-base) var(--ease); }
      .seg.on { background: var(--label-3); }

      .wide { margin-top: var(--x3); padding: var(--x5); display: flex; align-items: center; gap: var(--x4); border-radius: var(--r-xl); }
      .legend { flex: 1; display: flex; flex-direction: column; gap: 15px; min-width: 0; }
      .litem { display: flex; gap: var(--x3); align-items: flex-start; }
      .ldot { width: 7px; height: 7px; border-radius: 50%; margin-top: 6px; flex: none; background: var(--label-3); }
      .lval { font-family: var(--font-display); font-size: 19px; font-weight: 700; letter-spacing: -0.45px; font-variant-numeric: tabular-nums; }
      .ring-box { position: relative; width: 112px; height: 112px; flex: none; }
      .avg-track { fill: none; stroke: var(--fill); stroke-width: 10; }
      .avg-fill {
        fill: none; stroke: var(--label-3); stroke-width: 10; stroke-linecap: round;
        stroke-dasharray: ${AVG_C};
        transform: rotate(-90deg); transform-origin: 58px 58px;
        transition: stroke-dashoffset 900ms var(--ease);
      }
      .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .rval { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.6px; }
      .rcap { font-size: 10px; font-weight: 600; letter-spacing: 1.1px; text-transform: uppercase; color: var(--label-3); margin-top: 1px; }

      .cd { margin-top: var(--x3); display: flex; align-items: center; gap: var(--x3); padding: var(--x4); }
      .cd-icon { width: 36px; height: 36px; border-radius: 12px; background: var(--fill); color: var(--label-2); display: inline-flex; align-items: center; justify-content: center; flex: none; }
      .cd-texts { flex: 1; min-width: 0; }
      .cd-line { display: flex; align-items: baseline; gap: 6px; }
      .cd-days { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.7px; }
      .cd-unit { font-size: 13.5px; color: var(--label-2); }
      .cd-bar { margin-top: 7px; height: 4px; border-radius: var(--r-pill); background: var(--fill-secondary); overflow: hidden; }
      .cd-fill { height: 100%; min-width: 4px; border-radius: var(--r-pill); background: var(--label-3); }
      .cd-when { display: inline-flex; align-items: center; gap: 1px; font-size: 12.5px; font-weight: 600; color: var(--label-3); flex: none; }

      /* ---------- DESKTOP: hero ---------- */
      .hero { display: grid; grid-template-columns: 1.5fr 1fr; gap: var(--x5); align-items: center; padding: var(--x6); }
      .hero-l { display: flex; flex-direction: column; align-items: flex-start; }
      .date { letter-spacing: 1px; }
      .hero-greet { margin: 6px 0 0; font-family: var(--font-display); font-size: clamp(26px, 3vw, 32px); font-weight: 800; letter-spacing: -0.9px; line-height: 1.08; }
      .streak-chip { display: inline-flex; align-items: center; gap: 6px; margin-top: var(--x4); padding: 7px 13px; border-radius: var(--r-pill); background: var(--fill); color: var(--label-2); font-size: 13.5px; font-weight: 500; }
      .streak-n { font-weight: 800; color: var(--label); font-variant-numeric: tabular-nums; }
      .hero-cta { margin-top: var(--x5); }
      .hero-r { display: flex; flex-direction: column; align-items: center; gap: var(--x3); }
      .ring-wrap { position: relative; width: 148px; height: 148px; }
      .ring { width: 148px; height: 148px; transform: rotate(-90deg); }
      .ring-track { fill: none; stroke: var(--fill); stroke-width: 10; }
      .ring-fill {
        fill: none; stroke: var(--label-3); stroke-width: 10; stroke-linecap: round;
        stroke-dasharray: ${RING_C};
        transition: stroke-dashoffset 900ms var(--ease);
      }
      .ring-val { font-family: var(--font-display); font-size: 29px; font-weight: 800; letter-spacing: -1px; }
      .ring-goal { color: var(--label-3); font-size: 18px; font-weight: 700; }
      .hero-week-msg { font-size: 12.5px; color: var(--label-2); text-align: center; max-width: 150px; }

      /* ---------- DESKTOP: statistici compacte ---------- */
      .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--x3); }
      .stat { padding: var(--x4) var(--x5); display: flex; flex-direction: column; }
      .stat-head { display: flex; align-items: center; gap: 9px; margin-bottom: var(--x3); }
      .stat-icon { width: 28px; height: 28px; border-radius: 9px; background: var(--fill); color: var(--label-2); display: inline-flex; align-items: center; justify-content: center; flex: none; }
      .stat-title { font-size: 13.5px; font-weight: 600; letter-spacing: -0.2px; color: var(--label-2); }
      .stat-val { font-family: var(--font-display); font-size: 28px; font-weight: 800; letter-spacing: -0.9px; line-height: 1; font-variant-numeric: tabular-nums; }
      .stat-desc { margin-top: 4px; font-size: 12.5px; color: var(--label-3); }

      /* ---------- MATERII ---------- */
      .subj-head { display: flex; align-items: center; justify-content: space-between; margin: var(--x3) 0 var(--x3); padding: 0 2px; }
      .profile-chip { display: inline-flex; align-items: center; gap: 3px; border: none; padding: 6px 11px; border-radius: var(--r-pill); background: var(--fill); color: var(--label-2); font-size: 12.5px; font-weight: 600; letter-spacing: -0.1px; }
      .subj-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--x3); }
      .subj-card { display: flex; flex-direction: column; border: none; text-align: left; cursor: pointer; padding: var(--x4); background: var(--surface); border-radius: var(--r-lg); box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline); }
      .subj-top { display: flex; align-items: center; justify-content: space-between; }
      .subj-pct { display: none; font-family: var(--font-display); font-size: 16px; font-weight: 700; letter-spacing: -0.4px; color: var(--label); }
      .subj-name { margin-top: var(--x3); font-size: 15px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.2; }
      .subj-sub { margin-top: 2px; font-size: 12.5px; color: var(--label-3); }
      .subj-bar { display: none; margin-top: var(--x3); height: 6px; border-radius: var(--r-pill); background: var(--fill); overflow: hidden; }
      .subj-fill { height: 100%; min-width: 6px; border-radius: var(--r-pill); background: var(--label-3); transition: width 900ms var(--ease); }
      .subj-foot { display: none; align-items: center; justify-content: space-between; margin-top: var(--x3); }
      .subj-meta { font-size: 12.5px; color: var(--label-3); }
      .subj-cont { display: inline-flex; align-items: center; gap: 1px; font-size: 12.5px; font-weight: 600; color: var(--blue); }

      @media (min-width: 620px) {
        .subj-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 960px) {
        .card { transition: transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease); }
        .stat:hover, .subj-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-floating), inset 0 0 0 0.5px var(--hairline); }
        .subj-sub { display: none; }
        .subj-pct { display: block; }
        .subj-bar { display: block; }
        .subj-foot { display: flex; }
      }
      @media (max-width: 620px) and (min-width: 960px) {
        /* niciodată — placeholder */
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
  readonly goalSlots = [0, 1, 2, 3, 4];
  readonly mounted = signal(false);

  constructor() {
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

  readonly latestGrade = computed(() => {
    const list = this.sessions();
    return list.length === 0 ? '–' : list[0].estimatedGrade.toFixed(1);
  });
  readonly averageLabel = computed(() => {
    const avg = this.progress().averageGrade;
    return avg === 0 ? '–' : avg.toFixed(1);
  });
  readonly avgOffset = computed(() => {
    const pct = Math.min(Math.max(this.progress().averageGrade / 10, 0), 1);
    return this.mounted() ? AVG_C * (1 - pct) : AVG_C;
  });

  readonly daysRemaining = computed(() => this.countdown.model().daysRemaining);
  readonly examYear = computed(() => this.countdown.model().examDate.getFullYear());
  readonly cdPercent = computed(() =>
    Math.min(Math.max(this.countdown.model().progressPercent * 100, 0), 100),
  );

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
    const examYear = this.examYear();
    return [
      { icon: 'doc-check', label: 'Subiecte', desc: 'rezolvate în total', count: p.solvedCount, decimals: 0, suffix: '', text: '' },
      { icon: 'flame', label: 'Obiectiv', desc: 'săptămâna asta', count: this.weeklySolved(), decimals: 0, suffix: '/' + WEEKLY_GOAL, text: '' },
      { icon: 'clock', label: 'Timp studiu', desc: 'total acumulat', count: null, decimals: 0, suffix: '', text: this.formatStudyTime(p.totalStudySeconds) },
      { icon: 'chart-bar', label: 'Streak', desc: p.streakDays === 1 ? 'zi la rând' : 'zile la rând', count: p.streakDays, decimals: 0, suffix: '', text: '' },
      p.averageGrade === 0
        ? { icon: 'star', label: 'Medie', desc: 'estimată', count: null, decimals: 0, suffix: '', text: '–' }
        : { icon: 'star', label: 'Medie', desc: 'estimată', count: p.averageGrade, decimals: 2, suffix: '', text: '' },
      { icon: 'calendar', label: 'Până la BAC', desc: 'Iunie ' + examYear, count: this.daysRemaining(), decimals: 0, suffix: ' zile', text: '' },
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
        '/subject', slugify(this.selectedProfile().name), slugify(last.subjectName), last.year, slugify(last.sessionName),
      ]);
    } else {
      this.router.navigateByUrl('/random');
    }
  }

  openSubject(subjectTitle: string): void {
    this.router.navigate(['/subject', slugify(this.selectedProfile().name), slugify(subjectTitle)]);
  }

  goExamDate(): void {
    this.settings.selection();
    this.router.navigateByUrl('/exam-date');
  }

  go(route: string): void {
    this.router.navigateByUrl(route);
  }
}
