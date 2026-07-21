import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { EmptyStateComponent, GlassHeaderComponent } from '../../ui/ui';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, GlassHeaderComponent],
  template: `
    <app-glass-header title="Istoric sesiuni" />
    <div class="page-scroll page-pad">
      <div style="height: 16px;"></div>

      @if (history().length === 0) {
        <div class="empty-wrapper">
          <app-empty-state
            icon="clock"
            title="Nicio sesiune încă"
            message="Sesiunile finalizate vor apărea aici."
          />
        </div>
      } @else {
        <div class="minimal-list">
          @for (h of history(); track h.id; let last = $last) {
            <div class="minimal-row" (click)="onRowClick()">
              
              <div class="row-content">
                <!-- Center Typography (no left icon) -->
                <div class="row-texts">
                  <div class="t-title">{{ h.subjectName }}</div>
                  <div class="t-subtitle">{{ h.year }} • {{ h.sessionName }} | {{ formatDuration(h.durationSeconds) }}</div>
                </div>
                
                <!-- Right Text Grade -->
                <div class="grade-text" 
                     [style.color]="getGradeColor(h.estimatedGrade)">
                  {{ h.estimatedGrade.toFixed(1) }}
                </div>
              </div>
              
              <!-- Full width Separator -->
              @if (!last) {
                <div class="row-separator"></div>
              }
            </div>
          }
        </div>
      }
      <div style="height: var(--tab-clearance)"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: #FFFFFF !important;
      }

      .page-scroll {
        background: #FFFFFF !important;
        min-height: 100dvh;
      }
      
      /* Header */
      .minimal-header {
        margin-top: -32px;
        padding: 8px 16px 18px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #FFFFFF;
        border-bottom: 1px solid #F0F0F0;
      }
      .back-btn {
        width: 36px;
        height: 36px;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1C1C1E;
        cursor: pointer;
        padding: 0;
        margin-left: -4px;
      }
      .back-btn:active {
        opacity: 0.5;
      }
      .minimal-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        color: #1C1C1E;
      }

      /* Minimal List */
      .minimal-list {
        background: #FFFFFF;
      }
      
      /* Row */
      .minimal-row {
        display: flex;
        flex-direction: column;
        cursor: pointer;
        background: #FFFFFF;
      }
      .minimal-row:active {
        background: #F9F9F9;
      }

      .row-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
      }

      .row-separator {
        height: 1px;
        background: #F0F0F0;
      }

      /* Texts */
      .row-texts {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        min-width: 0;
      }
      .t-title {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 600;
        color: #1C1C1E;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .t-subtitle {
        font-family: var(--font-display);
        font-size: 13px;
        font-weight: 500;
        color: #8E8E93;
      }

      /* Grade Text */
      .grade-text {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 700;
        flex: none;
        padding-left: 12px;
      }
      
      .empty-wrapper {
        padding-top: 40px;
        background: #FFFFFF;
      }
    `
  ]
})
export class HistoryComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  readonly history = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchSessions(user)() : [];
  });

  onRowClick(): void {
  }

  formatDuration(seconds: number): string {
    const hours = Math.trunc(seconds / 3600);
    const minutes = Math.trunc((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  getGradeColor(g: number): string {
    if (g >= 9.0) return '#34C759'; // Green
    if (g < 5.0) return '#FF3B30'; // Red
    return '#8E8E93'; // Neutral gray
  }
}
