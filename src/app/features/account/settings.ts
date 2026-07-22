/** Setări — port al SettingsScreen din account_screens.dart. */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { profileDefaults } from '../../core/models/profile-data';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import {
  CardGroupComponent,
  CardRowComponent,
  DialogService,
  GlassHeaderComponent,
  IconComponent,
  SwitchComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardGroupComponent,
    CardRowComponent,
    GlassHeaderComponent,
    IconComponent,
    SwitchComponent,
  ],
  template: `
    <app-glass-header title="Setări" />
    <div class="page-scroll">
      <div class="settings-container">
        
        <app-card-group header="Aspect">
          <div class="swcell">
            <span class="gicon"><app-icon name="moon-fill" [size]="18" /></span>
            <span class="swlabel">Dark mode</span>
            <app-switch [value]="settingsSvc.darkMode()" (valueChange)="setDarkMode($event)" />
          </div>
          <div class="swcell">
            <span class="gicon"><app-icon name="hex-grid" [size]="18" /></span>
            <span class="swlabel">Feedback haptic</span>
            <app-switch [value]="profile().haptics" (valueChange)="setHaptics($event)" />
          </div>
        </app-card-group>

        <app-card-group header="Date">
          <div class="swcell">
            <span class="gicon"><app-icon name="cloud" [size]="18" /></span>
            <span class="swlabel">Salvare automată</span>
            <app-switch [value]="profile().autoSave" (valueChange)="setAutoSave($event)" />
          </div>
          <app-card-row
            title="Exportă datele mele"
            subtitle="Generează raport PDF"
            (rowTap)="exportData()"
          >
            <span slot="leading" class="gicon"><app-icon name="arrow-down-circle" [size]="18" /></span>
          </app-card-row>
          <app-card-row
            title="Șterge tot istoricul"
            subtitle="Acțiune ireversibilă"
            (rowTap)="confirmDeleteHistory()"
          >
            <span slot="leading" class="gicon danger"><app-icon name="trash" [size]="18" /></span>
          </app-card-row>
        </app-card-group>

        <div class="settings-footer">
          Version 1.0.0
        </div>
        <div style="height: 32px"></div>

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
      .settings-container {
        padding-top: 16px;
        background: #FFFFFF !important;
      }
      .swcell {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 62px;
        padding: 12px 18px;
        box-sizing: border-box;
        background: #FAFAFC;
      }
      .swlabel {
        flex: 1;
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 500;
        color: #111827;
      }
      .gicon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #F4F4F6;
        color: #8E8E93;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
      .gicon.danger {
        background: rgba(255, 59, 48, 0.1);
        color: #FF3B30;
      }
      .settings-footer {
        text-align: center;
        font-family: var(--font-display);
        font-size: 13px;
        font-weight: 400;
        color: #9CA3AF;
        margin-top: 32px;
      }

      :host-context(.dark) {
        display: block;
        background: #000000 !important;
      }
      :host-context(.dark) .page-scroll,
      :host-context(.dark) .settings-container {
        background: #000000 !important;
      }
      :host-context(.dark) .swcell {
        background: #1C1C1E;
      }
      :host-context(.dark) .swlabel {
        color: #FFFFFF;
      }
      :host-context(.dark) .gicon {
        background: #2C2C2E;
        color: #8E8E93;
      }
      :host-context(.dark) .gicon.danger {
        background: rgba(255, 59, 48, 0.2);
        color: #FF453A;
      }
    `,
  ],
})
export class SettingsComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  readonly settingsSvc = inject(AppSettingsService);
  private pdfExport = inject(PdfExportService);
  private dialogs = inject(DialogService);

  readonly profile = computed(() => {
    const user = this.auth.user();
    return user
      ? this.firestore.watchProfile(user)()
      : profileDefaults({ uid: '', email: null, displayName: null });
  });

  async setDarkMode(v: boolean): Promise<void> {
    this.settingsSvc.setDarkMode(v);
    const user = this.auth.currentUser;
    if (user) await this.firestore.updateSettings(user, { darkMode: v });
  }

  async setHaptics(v: boolean): Promise<void> {
    this.settingsSvc.setHaptics(v);
    const user = this.auth.currentUser;
    if (user) await this.firestore.updateSettings(user, { haptics: v });
  }

  async setAutoSave(v: boolean): Promise<void> {
    const user = this.auth.currentUser;
    if (user) await this.firestore.updateSettings(user, { autoSave: v });
  }

  async exportData(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const sessions = this.firestore.watchSessions(user)();
    const fileName = await this.pdfExport.exportUserData(this.profile(), sessions);
    await this.dialogs.alert('PDF exportat', `Raportul a fost descărcat:\n${fileName}`);
  }

  async confirmDeleteHistory(): Promise<void> {
    const confirmed = await this.dialogs.confirm(
      'Șterge istoricul?',
      'Toate sesiunile și notele vor fi șterse permanent.',
      'Șterge',
      'Anulează',
      true,
    );
    if (!confirmed) return;
    const user = this.auth.currentUser;
    if (user) await this.firestore.deleteAllSessions(user);
  }
}
