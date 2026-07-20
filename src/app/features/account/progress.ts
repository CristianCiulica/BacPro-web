/**
 * Progres & Statistici — redesign monocrom, aerisit: XP pe un card simplu cu
 * bară plată, staturi 2×2 doar cifră + etichetă, progres pe materii cu bare
 * subțiri gri, badge-uri într-o grilă discretă. Fără gradiente, fără culori.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import {
  level,
  nextLevelProgress,
  xpToNextLevel,
} from '../../core/models/gamification';
import { progressFromSessions } from '../../core/models/profile-data';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { GamificationService } from '../../core/services/gamification.service';
import {
  EmptyStateComponent,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-progress-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, GlassHeaderComponent, IconComponent],
  template: `
    <app-glass-header title="Progres" />
    <div class="page-scroll">
      <!-- XP -->
      <div class="page-pad" style="padding-top: var(--x5)">
        <div class="card xp">
          <div class="xp-row">
            <span class="gicon"><app-icon name="bolt-fill" [size]="18" /></span>
            <div class="xp-texts">
              <div class="xp-total">{{ gam().xpTotal }} XP</div>
              <div class="t-caption">{{ xpToNext() }} XP până la nivelul următor</div>
            </div>
            <span class="lvl">Nivel {{ lvl() }}</span>
          </div>
          <div class="bar">
            <div class="bar-fill" [style.width.%]="lvlProgress() * 100"></div>
          </div>
        </div>
      </div>

      <!-- Staturi 2×2 — doar cifre -->
      <div class="page-pad grid">
        <div class="card stat">
          <div class="sval">{{ progress().solvedCount }}</div>
          <div class="t-caption">Subiecte rezolvate</div>
        </div>
        <div class="card stat">
          <div class="sval">{{ formatDuration(progress().totalStudySeconds) }}</div>
          <div class="t-caption">Timp total studiu</div>
        </div>
        <div class="card stat">
          <div class="sval">{{ progress().averageGrade === 0 ? '–' : progress().averageGrade.toFixed(2) }}</div>
          <div class="t-caption">Medie generală</div>
        </div>
        <div class="card stat">
          <div class="sval">{{ progress().streakDays }} {{ progress().streakDays === 1 ? 'zi' : 'zile' }}</div>
          <div class="t-caption">Streak curent</div>
        </div>
      </div>

      <!-- Progres pe materii -->
      <div class="page-pad" style="padding-top: var(--x6)">
        <div class="t-section section-header">Progres pe materii</div>
        <div class="card">
          @if (subjectEntries().length === 0) {
            <app-empty-state
              icon="chart-square"
              title="Nicio sesiune încă"
              message="Progresul pe materii apare după prima sesiune salvată."
            />
          } @else {
            @for (entry of subjectEntries(); track entry[0]; let last = $last) {
              <div class="subj" [class.bordered]="!last">
                <div class="subj-row">
                  <span class="t-body" style="font-weight: 500">{{ entry[0] }}</span>
                  <span class="subj-pct">{{ pctLabel(entry[1]) }}%</span>
                </div>
                <div class="bar thin">
                  <div class="bar-fill" [style.width.%]="entry[1] * 100"></div>
                </div>
              </div>
            }
          }
        </div>
        @if (sessions().length === 0) {
          <div class="t-caption" style="padding: var(--x2) var(--x2) 0">
            Rezolvă un subiect ca să apară progresul real.
          </div>
        }
      </div>

      <!-- Badge-uri -->
      <div class="page-pad" style="padding-top: var(--x6)">
        <div class="t-section section-header">Badge-uri</div>
        <div class="badges">
          @for (badge of badges(); track badge.id) {
            <div class="badge-tile" [class.locked]="badge.unlockedAt === null">
              <app-icon
                [name]="badge.unlockedAt !== null ? 'check-seal-fill' : 'lock'"
                [size]="18"
              />
              <div class="badge-title">{{ badge.title }}</div>
              <div class="t-caption badge-desc">{{ badge.description }}</div>
            </div>
          }
        </div>
      </div>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .card {
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
      }
      .gicon {
        width: 36px; height: 36px;
        border-radius: 12px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }

      .xp { padding: var(--x4) var(--x5) var(--x5); }
      .xp-row { display: flex; align-items: center; gap: var(--x3); }
      .xp-texts { flex: 1; min-width: 0; }
      .xp-total {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 800;
        letter-spacing: -0.5px;
        font-variant-numeric: tabular-nums;
      }
      .lvl {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--label-2);
        background: var(--fill);
        padding: 5px 11px;
        border-radius: var(--r-pill);
      }

      /* bare plate, fără gradiente */
      .bar {
        margin-top: var(--x4);
        height: 6px;
        border-radius: var(--r-pill);
        background: var(--fill);
        overflow: hidden;
      }
      .bar.thin { height: 4px; margin-top: var(--x2); }
      .bar-fill {
        height: 100%;
        border-radius: var(--r-pill);
        background: var(--label-2);
        transition: width var(--dur-slow) var(--ease);
      }

      .grid {
        margin-top: var(--x3);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--x3);
      }
      .stat { padding: var(--x4); }
      .sval {
        font-family: var(--font-display);
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.8px;
        font-variant-numeric: tabular-nums;
      }
      .stat .t-caption { margin-top: 3px; }

      .subj { padding: 14px var(--x4); }
      .subj.bordered { border-bottom: 0.5px solid var(--separator); }
      .subj-row { display: flex; align-items: center; justify-content: space-between; }
      .subj-pct { font-size: 13.5px; font-weight: 600; color: var(--label-2); font-variant-numeric: tabular-nums; }

      .badges { display: grid; grid-template-columns: 1fr 1fr; gap: var(--x3); }
      .badge-tile {
        background: var(--surface);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
        padding: var(--x4);
        color: var(--label-2);
      }
      .badge-tile.locked { color: var(--label-3); }
      .badge-title {
        margin-top: var(--x2);
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.2px;
        color: var(--label);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge-tile.locked .badge-title { color: var(--label-2); }
      .badge-desc {
        margin-top: 2px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class ProgressScreenComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private gamification = inject(GamificationService);

  readonly gam = this.gamification.model;
  readonly lvl = computed(() => level(this.gam()));
  readonly lvlProgress = computed(() => nextLevelProgress(this.gam()));
  readonly xpToNext = computed(() => xpToNextLevel(this.gam()));

  readonly sessions = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchSessions(user)() : [];
  });
  readonly progress = computed(() => progressFromSessions(this.sessions()));
  readonly subjectEntries = computed(() =>
    [...this.progress().subjectProgress.entries()].sort((a, b) => a[0].localeCompare(b[0])),
  );
  readonly badges = computed(() =>
    [...this.gam().badges.values()].sort((a, b) => a.title.localeCompare(b.title)),
  );

  formatDuration(seconds: number): string {
    const hours = Math.trunc(seconds / 3600);
    const minutes = Math.trunc((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  pctLabel(value: number): number {
    return Math.trunc(value * 100);
  }
}
