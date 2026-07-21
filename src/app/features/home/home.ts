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
  imports: [CountComponent, IconComponent, TintedIconComponent],
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

        <!-- ============ DESKTOP: macOS HIG Layout (≥960px) ============ -->
        <div class="top-d">
          <header class="mac-header rise">
            <div class="mac-title-area">
              <div class="mac-date">{{ todayLabel() }}</div>
              <h1 class="mac-title">Bine ai revenit, {{ firstName() }}</h1>
            </div>
            <div class="mac-header-actions">
              <div class="mac-streak-badge">
                <app-icon name="flame" [size]="14" />
                <span>{{ progress().streakDays }} {{ progress().streakDays === 1 ? 'zi' : 'zile' }} la rând</span>
              </div>
              <button class="mac-btn-primary" (click)="continueLearning()">
                <app-icon name="play-fill" [size]="14" />
                <span>Continuă învățarea</span>
              </button>
            </div>
          </header>

          <div class="mac-panel card rise rise-1">
            <div class="mac-panel-hero">
              <div class="mac-ring-side">
                <div class="mac-ring-wrap">
                  <svg viewBox="0 0 120 120" class="mac-ring">
                    <circle class="mac-ring-track" cx="60" cy="60" r="52" />
                    <circle class="mac-ring-fill" cx="60" cy="60" r="52" [attr.stroke-dashoffset]="ringOffset()" />
                  </svg>
                  <div class="mac-ring-center">
                    <div class="mac-ring-val"><app-count [value]="weeklySolved()" /><span class="mac-ring-goal">/{{ weeklyGoal }}</span></div>
                    <div class="mac-ring-cap">Obiectiv</div>
                  </div>
                </div>
                <div class="mac-ring-info">
                  <div class="mac-ring-title">Obiectiv Săptămânal</div>
                  <div class="mac-ring-sub">{{ goalDone() ? 'Obiectiv complet atins' : 'subiecte rezolvate săptămâna asta' }}</div>
                </div>
              </div>
            </div>

            <div class="mac-divider"></div>

            <div class="mac-stats-row">
              @for (s of stats(); track s.label) {
                <div class="mac-stat-item">
                  <div class="mac-stat-label">
                    <app-icon [name]="s.icon" [size]="14" />
                    <span>{{ s.label }}</span>
                  </div>
                  <div class="mac-stat-val">
                    @if (s.count !== null) {
                      <app-count [value]="s.count" [decimals]="s.decimals" />{{ s.suffix }}
                    } @else {
                      {{ s.text }}
                    }
                  </div>
                  <div class="mac-stat-desc">{{ s.desc }}</div>
                </div>
              }
            </div>
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
                </div>
                <div class="subj-name">{{ s.title }}</div>
                <div class="subj-sub">2020 – 2025</div>
                <div class="subj-foot">
                  <span class="subj-meta">{{ s.count }} {{ s.count === 1 ? 'subiect rezolvat' : 'subiecte rezolvate' }}</span>
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

      /* ---------- MATERII (comun, adaptiv) ---------- */
      .subj-head { display: flex; align-items: flex-end; justify-content: space-between; margin: var(--x5) 4px var(--x3); }
      .subj-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--x3); }
      .subj-card { display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: var(--x4); border: none; cursor: pointer; }
      .subj-top { margin-bottom: 12px; }
      .subj-name { font-size: 15px; font-weight: 600; color: var(--label); }
      .subj-meta { font-size: 12px; color: var(--label-2); margin-top: 4px; }
      .subj-sub { display: none; }
      .subj-foot { display: none; }
      .profile-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: var(--blue); background: transparent; border: none; padding: 0; cursor: pointer; }

      /* ---------- DESKTOP: macOS HIG Layout (min-width: 960px) ---------- */
      @media (min-width: 960px) {
        .mac-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 0 4px;
        }
        .mac-date {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.1px;
          color: var(--label-2);
          text-transform: capitalize;
          margin-bottom: 2px;
        }
        .mac-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.6px;
          color: var(--label);
        }
        .mac-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mac-streak-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          background: var(--fill);
          color: var(--label-2);
          font-size: 13px;
          font-weight: 500;
        }
        .mac-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border: none;
          border-radius: 6px;
          background: var(--label);
          color: var(--surface);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.1px;
          cursor: pointer;
          transition: opacity 100ms ease-out;
        }
        .mac-btn-primary:hover { opacity: 0.92; }
        .mac-btn-primary:active { opacity: 0.8; }

        .mac-panel {
          background: var(--surface);
          border-radius: 12px;
          border: 0.5px solid var(--hairline);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .mac-panel-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mac-ring-side {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .mac-ring-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          flex: none;
        }
        .mac-ring {
          width: 88px;
          height: 88px;
          transform: rotate(-90deg);
        }
        .mac-ring-track { fill: none; stroke: var(--fill); stroke-width: 9; }
        .mac-ring-fill {
          fill: none;
          stroke: var(--label-3);
          stroke-width: 9;
          stroke-linecap: round;
          stroke-dasharray: ${RING_C};
          transition: stroke-dashoffset 900ms var(--ease);
        }
        .mac-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .mac-ring-val {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: var(--label);
        }
        .mac-ring-goal {
          color: var(--label-3);
          font-size: 13px;
          font-weight: 500;
        }
        .mac-ring-cap {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--label-3);
        }
        .mac-ring-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mac-ring-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.2px;
          color: var(--label);
        }
        .mac-ring-sub {
          font-size: 13px;
          color: var(--label-2);
        }

        .mac-divider {
          height: 0.5px;
          background: var(--separator);
          margin: 0 -24px;
        }

        .mac-stats-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }
        .mac-stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mac-stat-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--label-2);
        }
        .mac-stat-val {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.4px;
          line-height: 1.1;
          color: var(--label);
          font-variant-numeric: tabular-nums;
        }
        .mac-stat-desc {
          font-size: 11px;
          color: var(--label-3);
        }

        .subj-head { margin: 12px 4px 16px; }
        .subj-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .subj-card { padding: 20px; border-radius: 12px; border: 0.5px solid var(--hairline); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); background: var(--surface); transition: all 150ms ease; }
        .subj-card:hover { border-color: rgba(0, 122, 255, 0.3); background: rgba(255, 255, 255, 0.95); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); transform: none; }
        .subj-name { font-size: 17px; letter-spacing: -0.3px; }
        .subj-meta { font-size: 13px; }
        .subj-sub { display: block; font-size: 13px; color: var(--label-3); margin-top: 2px; }
        .subj-foot { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 20px; }
        .subj-cont { display: inline-flex; align-items: center; gap: 2px; font-size: 13px; font-weight: 500; color: var(--blue); opacity: 0; transform: translateX(-4px); transition: all 150ms ease; }
        .subj-card:hover .subj-cont { opacity: 1; transform: translateX(0); }
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
