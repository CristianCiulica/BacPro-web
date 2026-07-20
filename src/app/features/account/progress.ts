/**
 * Progres & Statistici — port al ProgressScreen + XPProgressCard + BadgeGrid
 * din aplicația mobilă.
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
  CardGroupComponent,
  EmptyStateComponent,
  GlassHeaderComponent,
  IconComponent,
  PillBadgeComponent,
  ProgressBarComponent,
  StatTileComponent,
  TintedIconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-progress-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardGroupComponent,
    EmptyStateComponent,
    GlassHeaderComponent,
    IconComponent,
    PillBadgeComponent,
    ProgressBarComponent,
    StatTileComponent,
    TintedIconComponent,
  ],
  template: `
    <app-glass-header title="Progres" />
    <div class="page-scroll">
      <!-- XP card -->
      <div class="page-pad" style="padding-top: var(--x5)">
        <div class="floating-card">
          <div class="xp-row">
            <app-tinted-icon icon="bolt-fill" color="#FF9500" [size]="36" />
            <div class="xp-texts">
              <div class="xp-total">{{ gam().xpTotal }} XP</div>
              <div class="t-caption">{{ xpToNext() }} XP până la următorul nivel</div>
            </div>
            <app-pill-badge [label]="'Nivel ' + lvl()" color="#FF9500" />
          </div>
          <div style="margin-top: var(--x4)">
            <app-progress-bar [value]="lvlProgress()" color="#FF9500" />
          </div>
        </div>
      </div>

      <!-- Staturi 2×2 -->
      <div class="page-pad stats-grid">
        <app-stat-tile
          label="Subiecte rezolvate"
          [value]="'' + progress().solvedCount"
          accent="#007AFF"
          icon="doc-check"
        />
        <app-stat-tile
          label="Timp total studiu"
          [value]="formatDuration(progress().totalStudySeconds)"
          accent="#5856D6"
          icon="clock"
        />
        <app-stat-tile
          label="Medie generală"
          [value]="progress().averageGrade === 0 ? '-' : progress().averageGrade.toFixed(2)"
          accent="#34C759"
          icon="chart-bar"
        />
        <app-stat-tile
          label="Streak curent"
          [value]="progress().streakDays + ' zile'"
          accent="#FF9500"
          icon="flame"
        />
      </div>

      <!-- Progres pe materii -->
      <app-card-group
        header="Progres pe materii"
        [footer]="sessions().length === 0 ? 'Rezolvă un subiect ca să apară progresul real.' : null"
      >
        @if (subjectEntries().length === 0) {
          <app-empty-state
            icon="chart-square"
            title="Nicio sesiune încă"
            message="Progresul pe materii apare după prima sesiune salvată."
          />
        } @else {
          @for (entry of subjectEntries(); track entry[0]) {
            <div class="subj-cell">
              <div class="subj-row">
                <span class="t-body" style="font-weight: 500">{{ entry[0] }}</span>
                <span class="subj-pct">{{ pctLabel(entry[1]) }}%</span>
              </div>
              <app-progress-bar [value]="entry[1]" [height]="6" />
            </div>
          }
        }
      </app-card-group>

      <!-- Badge-uri -->
      <div class="page-pad" style="padding-top: var(--x5)">
        <div class="t-section section-header">Badge-uri</div>
        <div class="badges">
          @for (badge of badges(); track badge.id) {
            <div class="badge-tile">
              <app-icon
                [name]="badge.unlockedAt !== null ? 'check-seal-fill' : 'lock'"
                [size]="20"
                [style.color]="badge.unlockedAt !== null ? 'var(--green)' : 'var(--label-3)'"
              />
              <div
                class="badge-title"
                [style.color]="badge.unlockedAt !== null ? 'var(--label)' : 'var(--label-2)'"
              >{{ badge.title }}</div>
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
      .xp-row { display: flex; align-items: center; gap: var(--x3); }
      .xp-texts { flex: 1; min-width: 0; }
      .xp-total { font-family: var(--font-display); font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
      .stats-grid {
        margin-top: var(--x3);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--x3);
      }
      .subj-cell { padding: 14px var(--x4); }
      .subj-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--x2); }
      .subj-pct { font-size: 14px; font-weight: 600; color: var(--blue); }
      .badges { display: grid; grid-template-columns: 1fr 1fr; gap: var(--x3); }
      .badge-tile {
        background: var(--surface);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-soft);
        padding: var(--x3) var(--x4);
        min-height: 132px;
      }
      .badge-title {
        margin-top: var(--x2);
        font-size: 15px;
        font-weight: 600;
        line-height: 1.15;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge-desc {
        margin-top: 3px;
        line-height: 1.25;
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
