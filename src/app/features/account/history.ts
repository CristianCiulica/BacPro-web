/** Istoric sesiuni — port al HistoryScreen din account_screens.dart. */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  CardGroupComponent,
  EmptyStateComponent,
  GlassHeaderComponent,
  accentGradient,
  tint,
} from '../../ui/ui';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardGroupComponent, EmptyStateComponent, GlassHeaderComponent],
  template: `
    <app-glass-header title="Istoric" />
    <div class="page-scroll">
      <app-card-group
        header="Sesiuni recente"
        [footer]="history().length === 0 ? 'Istoricul se completează când marchezi subiecte ca rezolvate.' : null"
      >
        @if (history().length === 0) {
          <app-empty-state
            icon="clock"
            title="Nicio sesiune încă"
            message="Sesiunile finalizate vor apărea aici."
          />
        } @else {
          @for (h of history(); track h.id) {
            <div class="hrow">
              <div class="bar" [style.background]="accentGradient(gradeColor(h.estimatedGrade))"></div>
              <div class="texts">
                <div class="t-body" style="font-weight: 500">{{ h.subjectName }}</div>
                <div class="t-subhead" style="margin-top: 2px">{{ h.year }} · {{ h.sessionName }}</div>
                <div class="t-caption" style="margin-top: 2px">
                  Durata: {{ formatDuration(h.durationSeconds) }}
                </div>
              </div>
              <div
                class="grade"
                [style.background]="tint(gradeColor(h.estimatedGrade))"
                [style.color]="gradeColor(h.estimatedGrade)"
              >{{ h.estimatedGrade.toFixed(1) }}</div>
            </div>
          }
        }
      </app-card-group>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .hrow { display: flex; align-items: center; gap: var(--x3); padding: 13px var(--x4); }
      .bar { width: 4px; height: 46px; border-radius: var(--r-pill); flex: none; }
      .texts { flex: 1; min-width: 0; }
      .grade {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.4px;
        padding: 6px 12px;
        border-radius: var(--r-sm);
        flex: none;
      }
    `,
  ],
})
export class HistoryComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);

  readonly history = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchSessions(user)() : [];
  });

  accentGradient = accentGradient;
  tint = tint;

  formatDuration(seconds: number): string {
    const hours = Math.trunc(seconds / 3600);
    const minutes = Math.trunc((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  gradeColor(g: number): string {
    if (g >= 8.5) return '#34C759';
    if (g >= 5) return '#FF9500';
    return '#FF3B30';
  }
}
