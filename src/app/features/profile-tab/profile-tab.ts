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
  imports: [GlassHeaderComponent, IconComponent],
  template: `
    <app-glass-header title="Profil" [showBack]="false" />
    <div class="page-scroll">
      <div class="journal-profile-wrap">
        <!-- Content-First Journal/Fitness Profile Header (Non-card) -->
        <header class="journal-header pressable" (click)="go('/user-profile')">
          <div class="journal-avatar-wrap">
            <app-icon name="person-fill" [size]="34" />
          </div>
          <div class="journal-header-info">
            <h1 class="journal-name">{{ auth.displayName }}</h1>
            <p class="journal-email">{{ auth.currentUser?.email ?? 'Cont BacPro' }}</p>
          </div>
          <app-icon name="chevron-right" [size]="14" class="journal-chevron" />
        </header>

        <!-- Grouped Settings List (Apple Journal / Books style) -->
        <div class="journal-group-wrap">
          <div class="journal-group-title">CONT & APLICAȚIE</div>
          <div class="journal-list">
            <div class="journal-row pressable" (click)="go('/user-profile')">
              <span class="journal-icon"><app-icon name="person-circle" [size]="20" /></span>
              <span class="journal-row-text">Profil utilizator</span>
              <app-icon name="chevron-right" [size]="13" class="journal-chevron" />
            </div>

            <div class="journal-row pressable" (click)="go('/settings')">
              <span class="journal-icon"><app-icon name="gear" [size]="20" /></span>
              <span class="journal-row-text">Setări</span>
              <app-icon name="chevron-right" [size]="13" class="journal-chevron" />
            </div>

            <div class="journal-row pressable" (click)="go('/about')">
              <span class="journal-icon"><app-icon name="info-circle" [size]="20" /></span>
              <span class="journal-row-text">Despre BacPro</span>
              <app-icon name="chevron-right" [size]="13" class="journal-chevron" />
            </div>
          </div>
        </div>

        <!-- Destructive Logout Section (Isolated, Monochrome + Red) -->
        <div class="journal-group-wrap">
          <div class="journal-list">
            <div class="journal-row pressable" (click)="signOut()">
              <span class="journal-icon danger"><app-icon name="logout" [size]="20" /></span>
              <span class="journal-row-text danger">Deconectează-te</span>
            </div>
          </div>
        </div>
      </div>

      <div style="height: var(--tab-clearance)"></div>
    </div>
  `,
  styles: [
    `
      .journal-profile-wrap {
        padding: 24px 20px 40px;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      /* Content-first Header (Journal / Books style) */
      .journal-header {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 4px 0;
        cursor: pointer;
      }
      .journal-avatar-wrap {
        width: 68px;
        height: 68px;
        border-radius: 50%;
        overflow: hidden;
        flex: none;
        background: var(--fill-secondary);
        box-shadow: inset 0 0 0 0.5px var(--hairline);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--label-2);
      }
      .journal-header-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .journal-name {
        margin: 0;
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
        color: var(--label);
        line-height: 1.2;
      }
      .journal-email {
        margin: 0;
        font-size: 14px;
        color: var(--label-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Clean Journal/Books Grouped List */
      .journal-group-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .journal-group-title {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.6px;
        color: var(--label-3);
        text-transform: uppercase;
        margin-left: 8px;
      }
      .journal-list {
        background: var(--surface);
        border-radius: 14px;
        overflow: hidden;
        box-shadow: inset 0 0 0 0.5px var(--hairline);
      }
      .journal-row {
        display: flex;
        align-items: center;
        gap: 16px;
        min-height: 56px;
        padding: 0 18px;
        cursor: pointer;
        background: transparent;
        transition: background 120ms ease-out;
      }
      .journal-row:not(:last-child) {
        border-bottom: 0.5px solid var(--separator);
      }
      .journal-row:active {
        background: rgba(0, 0, 0, 0.04);
      }
      :host-context(.dark) .journal-row:active {
        background: rgba(255, 255, 255, 0.06);
      }

      /* Graphite monochrome icons */
      .journal-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--label-2);
        flex: none;
      }
      .journal-icon.danger {
        color: var(--red);
      }
      .journal-row-text {
        flex: 1;
        font-size: 16.5px;
        font-weight: 400;
        letter-spacing: -0.2px;
        color: var(--label);
      }
      .journal-row-text.danger {
        color: var(--red);
        font-weight: 500;
      }
      .journal-chevron {
        color: var(--label-3);
        flex: none;
      }
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
