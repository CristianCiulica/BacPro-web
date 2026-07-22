import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  DialogService,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-dev-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    GlassHeaderComponent,
    IconComponent,
  ],
  template: `
    <app-glass-header title="Mesaje dezvoltator" />
    
    <div class="page-scroll">
      <div class="dev-container">
        
        <!-- ─── SUGGESTION FORM SECTION ─── -->
        <div class="section-label">TRIMITE SUGESTIE</div>
        <div class="subtitle">Scrie ce ai vrea să îmbunătățim în BacPro.</div>
        
        <div class="form-wrapper">
          <textarea
            class="clean-textarea"
            rows="4"
            placeholder="Ex: aș vrea filtre pe ani, profil..."
            [(ngModel)]="messageText"
          ></textarea>
          
          <button 
            class="submit-btn" 
            [disabled]="sending() || !messageText.trim()"
            (click)="sendMessage()">
            @if (sending()) {
              Trimite...
            } @else {
              Trimite mesaj
            }
          </button>
        </div>

        <!-- ─── HISTORY SECTION ─── -->
        <div class="section-label history-label">ISTORIC</div>

        @if (messages().length === 0) {
          <!-- Centered empty state directly on page (No surrounding card) -->
          <div class="empty-state-container">
            <div class="paperplane-icon">
              <app-icon name="paperplane" [size]="48" />
            </div>
            <h3 class="empty-title">Nicio sugestie trimisă</h3>
            <p class="empty-subtitle">Mesajele trimise către dezvoltator vor apărea aici.</p>
          </div>
        } @else {
          <div class="msg-list">
            @for (message of messages(); track message.id) {
              <div class="msg-card">
                <div class="msg-text">{{ message.text }}</div>
                <div class="msg-date">{{ formatMessageTime(message.createdAt) }}</div>
              </div>
            }
          </div>
        }

        <div style="height: 48px;"></div>
      </div>
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

      .dev-container {
        padding: 36px 24px 0;
        max-width: 680px;
        margin: 0 auto;
        background: #FFFFFF !important;
      }

      /* Section Label */
      .section-label {
        font-family: var(--font-display);
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #9CA3AF;
        margin-bottom: 6px;
      }
      .section-label.history-label {
        margin-top: 36px;
        margin-bottom: 14px;
      }

      .subtitle {
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 400;
        color: #6B7280;
        margin-bottom: 14px;
      }

      /* Form Wrapper */
      .form-wrapper {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      /* Clean Textarea */
      .clean-textarea {
        width: 100%;
        min-height: 120px;
        background: #FAFAFC;
        border: 1px solid #E5E7EB;
        border-radius: 20px;
        padding: 18px 20px;
        font-family: var(--font-display);
        font-size: 15px;
        line-height: 1.5;
        color: #111827;
        resize: vertical;
        box-shadow: none;
        outline: none;
        transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
        box-sizing: border-box;
      }
      .clean-textarea::placeholder {
        color: #9CA3AF;
      }
      .clean-textarea:focus {
        border-color: #9CA3AF;
        background: #FFFFFF;
        box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.15);
      }

      /* Submit Button */
      .submit-btn {
        width: 100%;
        height: 56px;
        background: #1C1C1E;
        color: #FFFFFF;
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 120ms ease-out, transform 120ms ease-out;
        box-shadow: none;
      }
      .submit-btn:active:not(:disabled) {
        opacity: 0.85;
        transform: scale(0.995);
      }
      .submit-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Empty State Container (Centered, No Card Wrapper) */
      .empty-state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 20px;
      }
      .paperplane-icon {
        color: #9CA3AF;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .empty-title {
        margin: 0 0 6px 0;
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 600;
        color: #111827;
      }
      .empty-subtitle {
        margin: 0;
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 400;
        color: #6B7280;
        max-width: 280px;
      }

      /* Message List */
      .msg-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .msg-card {
        background: #FAFAFC;
        border: 1px solid #E5E7EB;
        border-radius: 16px;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .msg-text {
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 400;
        color: #111827;
        line-height: 1.45;
        white-space: pre-wrap;
      }
      .msg-date {
        font-family: var(--font-display);
        font-size: 12px;
        font-weight: 400;
        color: #9CA3AF;
      }

      :host-context(.dark) {
        &, .page-scroll, .dev-container { background: #000000 !important; }
        .clean-textarea, .msg-card {
          background: #1C1C1E;
          border-color: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }
        .clean-textarea::placeholder { color: #6B7280; }
        .submit-btn { background: #FFFFFF; color: #1C1C1E; }
        .empty-title, .msg-text { color: #FFFFFF; }
        .subtitle, .empty-subtitle { color: #9CA3AF; }
        .paperplane-icon, .section-label, .msg-date { color: #6B7280; }
      }
    `,
  ],
})
export class DevMessagesComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  readonly sending = signal(false);
  messageText = '';

  readonly messages = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchDeveloperMessages(user)() : [];
  });

  async sendMessage(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      await this.dialogs.alert('Neautentificat', 'Conectează-te pentru a trimite mesajul.');
      return;
    }
    const text = this.messageText.trim();
    if (text === '') return;

    this.sending.set(true);
    try {
      await this.firestore.sendDeveloperMessage(user, text);
      this.messageText = '';
      this.settings.medium();
    } catch {
      await this.dialogs.alert('Eroare', 'Nu am putut trimite mesajul acum.');
    } finally {
      this.sending.set(false);
    }
  }

  formatMessageTime(value: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(value.getDate())}.${p(value.getMonth() + 1)} ${p(value.getHours())}:${p(value.getMinutes())}`;
  }
}
