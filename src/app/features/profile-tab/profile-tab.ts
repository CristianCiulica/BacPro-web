/** Tab-ul Profil — port al ProfileTabScreen din main_shell.dart. */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import {
  CardGroupComponent,
  CardRowComponent,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';

@Component({
  selector: 'app-profile-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardGroupComponent, CardRowComponent, GlassHeaderComponent, IconComponent],
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
          <span slot="leading" class="gicon"><app-icon name="person-circle" [size]="20" /></span>
        </app-card-row>
        <app-card-row title="Setări" (rowTap)="go('/settings')">
          <span slot="leading" class="gicon"><app-icon name="gear" [size]="20" /></span>
        </app-card-row>
        <app-card-row title="Despre BacPro" (rowTap)="go('/about')">
          <span slot="leading" class="gicon"><app-icon name="info-circle" [size]="20" /></span>
        </app-card-row>
        <app-card-row title="Deconectează-te" (rowTap)="signOut()">
          <span slot="leading" class="gicon danger"><app-icon name="logout" [size]="20" /></span>
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
