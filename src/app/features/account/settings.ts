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
      <app-card-group header="Aspect">
        <div class="swcell">
          <span class="gicon"><app-icon name="moon-fill" [size]="19" /></span>
          <span class="t-body swlabel">Dark mode</span>
          <app-switch [value]="settingsSvc.darkMode()" (valueChange)="setDarkMode($event)" />
        </div>
        <div class="swcell">
          <span class="gicon"><app-icon name="hex-grid" [size]="20" /></span>
          <span class="t-body swlabel">Feedback haptic</span>
          <app-switch [value]="profile().haptics" (valueChange)="setHaptics($event)" />
        </div>
      </app-card-group>

      <app-card-group header="Date">
        <div class="swcell">
          <span class="gicon"><app-icon name="cloud" [size]="20" /></span>
          <span class="t-body swlabel">Salvare automată</span>
          <app-switch [value]="profile().autoSave" (valueChange)="setAutoSave($event)" />
        </div>
        <app-card-row
          title="Exportă datele mele"
          subtitle="Generează raport PDF"
          (rowTap)="exportData()"
        >
          <span slot="leading" class="gicon"><app-icon name="arrow-down-circle" [size]="20" /></span>
        </app-card-row>
        <app-card-row
          title="Șterge tot istoricul"
          subtitle="Acțiune ireversibilă"
          (rowTap)="confirmDeleteHistory()"
        >
          <span slot="leading" class="gicon danger"><app-icon name="trash" [size]="20" /></span>
        </app-card-row>
      </app-card-group>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .swcell { display: flex; align-items: center; gap: 14px; padding: 10px var(--x4); }
      .swlabel { flex: 1; font-weight: 500; }
      .gicon {
        width: 40px; height: 40px;
        border-radius: 13px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
      .gicon.danger { color: var(--red); }
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
