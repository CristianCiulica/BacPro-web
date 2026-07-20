/** Mesaje dezvoltator — port al DeveloperMessagesScreen din main_shell.dart. */
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
  AppButtonComponent,
  CardGroupComponent,
  DialogService,
  EmptyStateComponent,
  GlassHeaderComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-dev-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AppButtonComponent,
    CardGroupComponent,
    EmptyStateComponent,
    GlassHeaderComponent,
  ],
  template: `
    <app-glass-header title="Mesaje dezvoltator" [titleSize]="26" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x5)">
        <div class="floating-card">
          <div class="t-headline">Trimite o sugestie</div>
          <div class="t-subhead" style="margin-top: 4px">
            Scrie ce ai vrea să îmbunătățim în BacPro.
          </div>
          <div class="app-input multiline" style="margin-top: var(--x4)">
            <textarea
              rows="4"
              placeholder="Ex: aș vrea filtre pe ani, profil..."
              [(ngModel)]="messageText"
            ></textarea>
          </div>
          <div style="margin-top: var(--x4)">
            <app-button
              label="Trimite mesaj"
              [loading]="sending()"
              [disabled]="sending()"
              (pressed)="sendMessage()"
            />
          </div>
        </div>
      </div>

      <app-card-group header="Istoric mesaje">
        @if (messages().length === 0) {
          <app-empty-state
            icon="paperplane"
            title="Niciun mesaj încă"
            message="Sugestiile trimise vor apărea aici."
          />
        } @else {
          <div class="msg-list">
            @for (message of messages(); track message.id) {
              <div class="msg">
                <div class="t-body">{{ message.text }}</div>
                <div class="t-caption" style="margin-top: 6px">
                  {{ formatMessageTime(message.createdAt) }}
                </div>
              </div>
            }
          </div>
        }
      </app-card-group>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .msg-list { padding: var(--x4); display: flex; flex-direction: column; gap: var(--x3); }
      .msg { background: var(--fill); border-radius: var(--r-sm); padding: var(--x4); }
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
