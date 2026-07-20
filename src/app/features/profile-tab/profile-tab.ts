/** Tab-ul Profil — port al ProfileTabScreen din main_shell.dart. */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import {
  CardGroupComponent,
  CardRowComponent,
  GlassHeaderComponent,
  TintedIconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-profile-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardGroupComponent, CardRowComponent, GlassHeaderComponent, TintedIconComponent],
  template: `
    <app-glass-header title="Profil" [showBack]="false" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x5)">
        <div class="floating-card who">
          <img class="pic" src="assets/images/login_hero.png" alt="" />
          <div class="texts">
            <div class="t-title name">{{ auth.displayName }}</div>
            <div class="t-subhead email">{{ auth.currentUser?.email ?? 'Cont BacPro' }}</div>
          </div>
        </div>
      </div>

      <app-card-group header="Cont">
        <app-card-row title="Profil utilizator" (rowTap)="go('/user-profile')">
          <app-tinted-icon slot="leading" icon="person-circle" color="#007AFF" />
        </app-card-row>
        <app-card-row title="Setări" (rowTap)="go('/settings')">
          <app-tinted-icon slot="leading" icon="gear" color="#5856D6" />
        </app-card-row>
        <app-card-row title="Despre BacPro" (rowTap)="go('/about')">
          <app-tinted-icon slot="leading" icon="info-circle" color="#30B0C0" />
        </app-card-row>
        <app-card-row title="Deconectează-te" (rowTap)="signOut()">
          <app-tinted-icon slot="leading" icon="logout" color="#FF3B30" />
        </app-card-row>
      </app-card-group>

      <div style="height: var(--tab-clearance)"></div>
    </div>
  `,
  styles: [
    `
      .who { display: flex; align-items: center; gap: var(--x4); }
      .pic { width: 54px; height: 54px; object-fit: cover; border-radius: var(--r-md); flex: none; }
      .texts { min-width: 0; }
      .name { font-size: 18px; }
      .email { margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `,
  ],
})
export class ProfileTabComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  go(route: string): void {
    this.router.navigateByUrl(route);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
