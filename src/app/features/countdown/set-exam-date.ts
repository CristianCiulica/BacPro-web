/**
 * Data examenului — port al SetExamDateScreen din
 * lib/features/countdown/screens/set_exam_date_screen.dart.
 * CupertinoDatePicker devine un input nativ de dată (min azi, max +2 ani).
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import { AppSettingsService } from '../../core/services/app-settings.service';
import { CountdownService } from '../../core/services/countdown.service';
import {
  AppButtonComponent,
  GlassHeaderComponent,
  TintedIconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-set-exam-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, GlassHeaderComponent, TintedIconComponent],
  template: `
    <app-glass-header title="Data examenului" [titleSize]="27" />
    <div class="page-scroll">
      <div class="page-pad content">
        <div class="t-subhead">
          Alege data oficială a examenului pentru countdown și un plan de studiu personalizat.
        </div>

        <div class="floating-card picker-card">
          <input
            class="date-input"
            type="date"
            [min]="minDate"
            [max]="maxDate"
            [ngModel]="selectedIso()"
            (ngModelChange)="onDateChange($event)"
          />
        </div>

        <div class="floating-card info-card">
          <app-tinted-icon icon="timer" color="#8E98AC" />
          <span class="t-headline">
            {{
              daysLeft() <= 0
                ? 'Examenul este astăzi sau a trecut.'
                : daysLeft() + ' zile până la examen'
            }}
          </span>
        </div>

        <app-button
          label="Salvează data"
          icon="check"
          [loading]="saving()"
          [disabled]="saving()"
          (pressed)="save()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .content { padding-top: var(--x5); display: flex; flex-direction: column; gap: var(--x4); }
      .picker-card { padding: var(--x3); }
      .date-input {
        width: 100%;
        border: none;
        outline: none;
        background: var(--fill);
        border-radius: var(--r-md);
        padding: 15px var(--x4);
        font-size: 17px;
        font-family: var(--font-text);
        color: var(--label);
      }
      .info-card { padding: var(--x4); border-radius: var(--r-md); display: flex; align-items: center; gap: var(--x3); }
    `,
  ],
})
export class SetExamDateComponent {
  private countdown = inject(CountdownService);
  private location = inject(Location);
  private settings = inject(AppSettingsService);

  readonly saving = signal(false);
  readonly selectedDate = signal(this.clampToRange(this.countdown.model().examDate));

  readonly minDate = toIso(today());
  readonly maxDate = toIso(new Date(new Date().getFullYear() + 2, 11, 31));

  readonly selectedIso = computed(() => toIso(this.selectedDate()));
  readonly daysLeft = computed(() =>
    Math.round((this.selectedDate().getTime() - today().getTime()) / 86400000),
  );

  onDateChange(value: string): void {
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    this.selectedDate.set(new Date(y, m - 1, d));
  }

  private clampToRange(date: Date): Date {
    const t = today();
    const max = new Date(t.getFullYear() + 2, 11, 31);
    if (date.getTime() < t.getTime()) return t;
    if (date.getTime() > max.getTime()) return max;
    return date;
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.settings.medium();
    await this.countdown.setExamDate(this.selectedDate());
    this.location.back();
  }
}

function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
