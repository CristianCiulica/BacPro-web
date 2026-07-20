/** Evaluează aplicația — port al AppRatingScreen din main_shell.dart. */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  AppButtonComponent,
  DialogService,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppButtonComponent, GlassHeaderComponent, IconComponent],
  template: `
    <app-glass-header title="Evaluează aplicația" [titleSize]="26" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x5)">
        <div class="floating-card">
          <div class="t-headline">Cât de utilă este BacPro?</div>
          <div class="stars">
            @for (value of [1, 2, 3, 4, 5]; track value) {
              <button
                class="star-btn"
                [class.on]="value <= rating()"
                (click)="setRating(value)"
                [attr.aria-label]="value + ' stele'"
              >
                <app-icon
                  [name]="value <= rating() ? 'star-fill' : 'star'"
                  [size]="30"
                />
              </button>
            }
          </div>
          <div class="app-input multiline" style="margin-top: var(--x5)">
            <textarea
              rows="4"
              placeholder="Ce ți-ar plăcea să îmbunătățim în continuare?"
              [(ngModel)]="notesText"
            ></textarea>
          </div>
          <div style="margin-top: var(--x4)">
            <app-button label="Trimite feedback" (pressed)="submitFeedback()" />
          </div>
        </div>
      </div>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .stars { display: flex; gap: 10px; margin-top: var(--x4); }
      .star-btn {
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        color: var(--label-3);
        transform: scale(0.88);
        transition: transform var(--dur-base) var(--spring), color var(--dur-base) ease;
      }
      .star-btn.on { color: var(--orange); transform: scale(1); }
    `,
  ],
})
export class RatingComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  readonly rating = signal(5);
  notesText = '';

  setRating(value: number): void {
    this.settings.selection();
    this.rating.set(value);
  }

  async submitFeedback(): Promise<void> {
    this.settings.medium();
    const user = this.auth.currentUser;
    if (!user) {
      await this.dialogs.alert('Neautentificat', 'Te rog conectează-te ca să trimiți feedback.');
      return;
    }
    const message = this.notesText.trim();
    try {
      await this.firestore.submitAppFeedback(user, this.rating(), message);
      await this.dialogs.alert(
        'Mulțumim!',
        `Feedback înregistrat: ${this.rating()}/5\n${message === '' ? 'Fără comentarii suplimentare.' : message}`,
      );
      this.notesText = '';
      this.rating.set(5);
    } catch {
      await this.dialogs.alert('Eroare', 'Nu am putut trimite feedback-ul acum.');
    }
  }
}
