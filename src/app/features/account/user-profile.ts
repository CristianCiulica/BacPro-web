/** Profil utilizator — port al UserProfileScreen din account_screens.dart. */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { appProfiles } from '../../core/models/catalog';
import { profileDefaults } from '../../core/models/profile-data';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  CardGroupComponent,
  CardRowComponent,
  DialogService,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardGroupComponent,
    CardRowComponent,
    GlassHeaderComponent,
    IconComponent,
  ],
  template: `
    <app-glass-header title="Profil" />
    <div class="page-scroll">
      <div class="hero">
        <div class="avatar"><app-icon name="person-fill" [size]="44" /></div>
        <div class="t-title" style="margin-top: var(--x4)">{{ profile().name }}</div>
        <div class="t-subhead" style="margin-top: 4px">{{ profile().school }}</div>
      </div>

      <app-card-group header="Informații personale">
        <div class="ecell" (click)="editName()">
          <span class="t-subhead elabel">Nume</span>
          <span class="t-body evalue">{{ profile().name }}</span>
          <app-icon name="pencil" [size]="17" style="color: var(--blue)" />
        </div>
        <div class="ecell" (click)="editSchool()">
          <span class="t-subhead elabel">Școală</span>
          <span class="t-body evalue">{{ profile().school }}</span>
          <app-icon name="pencil" [size]="17" style="color: var(--blue)" />
        </div>
      </app-card-group>

      <app-card-group header="Profil BAC">
        @for (bacProfile of profiles; track bacProfile.name) {
          <app-card-row
            [title]="bacProfile.name"
            [showChevron]="false"
            (rowTap)="selectProfile(bacProfile.name)"
          >
            <span slot="leading" class="picon"><app-icon [name]="bacProfile.icon" [size]="20" /></span>
            @if (profile().selectedProfile === bacProfile.name) {
              <app-icon slot="trailing" name="check-circle-fill" [size]="22" style="color: var(--blue)" />
            }
          </app-card-row>
        }
      </app-card-group>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .hero { display: flex; flex-direction: column; align-items: center; padding-top: var(--x6); text-align: center; }
      .avatar {
        width: 92px; height: 92px;
        border-radius: var(--r-xl);
        background: var(--fill);
        color: var(--label-2);
        display: flex; align-items: center; justify-content: center;
      }
      .ecell { display: flex; align-items: center; padding: 14px var(--x4); cursor: pointer; gap: var(--x2); }
      .ecell:active { background: var(--fill); }
      .elabel { width: 90px; flex: none; }
      .picon {
        width: 40px; height: 40px;
        border-radius: 13px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
      .evalue { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `,
  ],
})
export class UserProfileComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  readonly profiles = appProfiles;
  readonly profile = computed(() => {
    const user = this.auth.user();
    return user
      ? this.firestore.watchProfile(user)()
      : profileDefaults({ uid: '', email: null, displayName: null });
  });

  async editName(): Promise<void> {
    this.settings.selection();
    const value = await this.dialogs.prompt('Nume', this.profile().name);
    if (value === null || value === '') return;
    await this.auth.updateDisplayName(value);
    const user = this.auth.currentUser;
    if (user) await this.firestore.updateProfile(user, { name: value });
  }

  async editSchool(): Promise<void> {
    this.settings.selection();
    const value = await this.dialogs.prompt('Școală', this.profile().school);
    if (value === null || value === '') return;
    const user = this.auth.currentUser;
    if (user) await this.firestore.updateProfile(user, { school: value });
  }

  async selectProfile(name: string): Promise<void> {
    const user = this.auth.currentUser;
    if (user) await this.firestore.updateProfile(user, { selectedProfile: name });
  }
}
