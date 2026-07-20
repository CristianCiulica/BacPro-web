/**
 * Countdown BAC — card compact și discret: suprafață albă, o singură linie
 * de text, progres subțire. Apăsabil → Data examenului.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CountdownService } from '../../core/services/countdown.service';
import { IconComponent } from '../../ui/ui';

@Component({
  selector: 'app-countdown-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="card">
      <span class="cal"><app-icon name="calendar" [size]="18" /></span>
      <div class="texts">
        <div class="line">
          <span class="days">{{ model().daysRemaining }}</span>
          <span class="unit">zile până la BAC</span>
        </div>
        <div class="track">
          <div class="tfill" [style.width.%]="percentNum()"></div>
        </div>
      </div>
      <span class="when">
        Iunie {{ examYear() }}
        <app-icon name="chevron-right" [size]="12" />
      </span>
    </div>
  `,
  styles: [
    `
      .card {
        display: flex;
        align-items: center;
        gap: var(--x3);
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
        padding: var(--x4);
      }
      .cal {
        width: 36px; height: 36px;
        border-radius: 12px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
      .texts { flex: 1; min-width: 0; }
      .line { display: flex; align-items: baseline; gap: 6px; }
      .days {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.7px;
        font-variant-numeric: tabular-nums;
      }
      .unit { font-size: 13.5px; color: var(--label-2); }
      .track {
        margin-top: 7px;
        height: 4px;
        border-radius: var(--r-pill);
        background: var(--fill-secondary);
        overflow: hidden;
      }
      .tfill {
        height: 100%;
        min-width: 4px;
        border-radius: var(--r-pill);
        background: var(--indigo);
        transition: width var(--dur-slow) var(--ease);
      }
      .when {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--label-3);
        flex: none;
      }
    `,
  ],
})
export class CountdownCardComponent {
  private countdown = inject(CountdownService);

  readonly model = this.countdown.model;
  readonly examYear = computed(() => this.model().examDate.getFullYear());
  readonly percentNum = computed(() =>
    Math.min(Math.max(this.model().progressPercent * 100, 0), 100),
  );
}
