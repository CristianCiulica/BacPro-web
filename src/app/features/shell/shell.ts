/**
 * Shell-ul principal — port al MainShell din main_shell.dart:
 * tab bar glass flotant (Acasă / Random / Profil) + meniul lateral (drawer)
 * cu statistici și toate intrările, deschis doar de pe tab-ul Acasă.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { profileDefaults, progressFromSessions } from '../../core/models/profile-data';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { IconComponent } from '../../ui/ui';

interface DrawerEntry {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, IconComponent],
  template: `
    <div class="shell">
      <!-- Sidebar persistent (doar desktop) -->
      <aside class="sidebar">
        <div class="sb-brand">
          <img class="sb-logo" src="assets/images/app_icon.png" alt="" />
          <span class="sb-name">BacPro</span>
        </div>
        <nav class="sb-nav">
          <div class="sb-group">
            @for (tab of tabs; track tab.route) {
              <button class="sb-item" [class.active]="isActive(tab.route)" (click)="go(tab.route)">
                <app-icon [name]="tab.icon" [size]="20" />
                <span>{{ tab.label }}</span>
              </button>
            }
          </div>
          @for (group of sidebarGroups; track group.label) {
            <div class="sb-label">{{ group.label }}</div>
            <div class="sb-group">
              @for (entry of group.items; track entry.label) {
                <button class="sb-item" [class.active]="isActive(entry.route)" (click)="go(entry.route)">
                  <app-icon [name]="entry.icon" [size]="20" />
                  <span>{{ entry.label }}</span>
                </button>
              }
            </div>
          }
        </nav>
        <div class="sb-foot">
          <div class="sb-user">
            <div class="sb-avatar"><app-icon name="person-fill" [size]="20" /></div>
            <div class="sb-uinfo">
              <div class="sb-uname">{{ auth.displayName }}</div>
              <div class="sb-uemail">{{ auth.currentUser?.email ?? profile().selectedProfile }}</div>
            </div>
          </div>
          <button class="sb-item danger" (click)="signOut()">
            <app-icon name="logout" [size]="20" />
            <span>Deconectează-te</span>
          </button>
        </div>
      </aside>

      <router-outlet />

      <!-- Meniul lateral (doar pe Acasă) -->
      @if (onHome()) {
        <div
          class="scrim"
          [class.open]="menuOpen()"
          (click)="closeMenu()"
        ></div>
        <aside class="drawer" [class.open]="menuOpen()">
          <div class="drawer-head">
            <div class="avatar">
              <app-icon name="person-fill" [size]="30" />
            </div>
            <div class="who">
              <div class="t-title uname">{{ auth.displayName }}</div>
              <div class="t-subhead school">
                {{ profile().school }} · {{ profile().selectedProfile }}
              </div>
            </div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="sval">{{ progress().solvedCount }}</div>
              <div class="t-caption">Subiecte</div>
            </div>
            <div class="vdiv"></div>
            <div class="stat">
              <div class="sval">{{ formatHours(progress().totalStudySeconds) }}</div>
              <div class="t-caption">Timp total</div>
            </div>
            <div class="vdiv"></div>
            <div class="stat">
              <div class="sval">{{ progress().averageGrade === 0 ? '-' : progress().averageGrade.toFixed(1) }}</div>
              <div class="t-caption">Medie</div>
            </div>
          </div>

          <nav class="drawer-body">
            @for (section of sections; track $index) {
              <div class="dsection">
                @for (entry of section; track entry.label) {
                  <div class="ditem" (click)="go(entry.route)">
                    <span class="dicon"><app-icon [name]="entry.icon" [size]="21" /></span>
                    <span class="t-body dlabel">{{ entry.label }}</span>
                    <app-icon name="chevron-right" [size]="14" style="color: var(--label-3)" />
                  </div>
                }
              </div>
            }
            <div class="dsection">
              <div class="ditem" (click)="signOut()">
                <span class="dicon danger"><app-icon name="logout" [size]="21" /></span>
                <span class="t-body dlabel danger">Deconectează-te</span>
                <app-icon name="chevron-right" [size]="14" style="color: var(--label-3)" />
              </div>
            </div>
          </nav>
        </aside>
      }

      <!-- Tab bar glass flotant (mobil, doar pe taburi) -->
      @if (isTabRoute()) {
      <nav class="tabbar-wrap">
        <div class="tabbar">
          @for (tab of tabs; track tab.route) {
            <button
              class="tab"
              [class.active]="isActive(tab.route)"
              (click)="goTab(tab.route)"
            >
              <app-icon [name]="tab.icon" [size]="23" />
              <span class="tlabel">{{ tab.label }}</span>
            </button>
          }
        </div>
      </nav>
      }
    </div>
  `,
  styles: [
    `
      .shell { min-height: 100dvh; padding-left: var(--sidebar-w); }

      /* ---------------- Sidebar desktop (ascuns pe mobil) ---------------- */
      .sidebar { display: none; }
      @media (min-width: 960px) {
        .sidebar {
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 14px; left: 14px; bottom: 14px;
          width: calc(var(--sidebar-w) - 26px);
          z-index: 70;
          padding: var(--x5) var(--x3) var(--x4);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.62);
          -webkit-backdrop-filter: blur(40px) saturate(1.8);
          backdrop-filter: blur(40px) saturate(1.8);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: var(--shadow-floating);
        }
      }
      .sb-brand { display: flex; align-items: center; gap: 11px; padding: 0 var(--x3) var(--x6); }
      .sb-logo { width: 34px; height: 34px; border-radius: 9px; box-shadow: var(--shadow-soft); }
      .sb-name { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.4px; }
      .sb-nav { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
      .sb-group { display: flex; flex-direction: column; gap: 2px; }
      .sb-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        color: var(--label-3);
        padding: 0 var(--x3);
        margin: var(--x5) 0 var(--x2);
      }
      .sb-item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 9px var(--x3);
        border: none;
        background: transparent;
        border-radius: 11px;
        color: var(--label-2);
        font-size: 15px;
        font-weight: 500;
        letter-spacing: -0.2px;
        text-align: left;
        cursor: pointer;
        transition: background 160ms var(--ease), color 160ms var(--ease), transform 160ms var(--spring);
      }
      .sb-item span { flex: 1; }
      .sb-item:hover { background: var(--fill); color: var(--label); }
      .sb-item:active { transform: scale(0.98); }
      .sb-item.active { background: rgba(0, 122, 255, 0.12); color: var(--blue); font-weight: 600; }
      .sb-item.active app-icon { color: var(--blue); }
      .sb-item.danger { color: var(--red); }
      .sb-item.danger:hover { background: rgba(255, 59, 48, 0.1); }
      .sb-foot { padding-top: var(--x3); margin-top: var(--x2); border-top: 1px solid var(--separator); }
      .sb-user { display: flex; align-items: center; gap: 10px; padding: 0 var(--x3) var(--x3); }
      .sb-avatar {
        width: 38px; height: 38px;
        flex: none;
        border-radius: 11px;
        background: var(--fill);
        color: var(--label-2);
        display: flex; align-items: center; justify-content: center;
      }
      .sb-uinfo { min-width: 0; }
      .sb-uname { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sb-uemail { font-size: 12px; color: var(--label-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      :host-context(.dark) .sidebar {
        background: rgba(16, 19, 27, 0.72);
        border-right-color: rgba(255, 255, 255, 0.07);
      }
      :host-context(.dark) .sb-item:hover { background: rgba(255, 255, 255, 0.06); }

      .scrim {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: rgba(0, 0, 0, 0.32);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--dur-base) var(--ease);
      }
      .scrim.open { opacity: 1; pointer-events: auto; }

      .drawer {
        position: fixed;
        top: 0; bottom: 0; left: 0;
        z-index: 61;
        width: 84%;
        max-width: 380px;
        background: rgba(252, 253, 255, 0.94);
        -webkit-backdrop-filter: blur(32px) saturate(1.6);
        backdrop-filter: blur(32px) saturate(1.6);
        border-radius: 0 var(--r-xl) var(--r-xl) 0;
        border-right: 1px solid rgba(255, 255, 255, 0.7);
        box-shadow: var(--shadow-floating);
        transform: translateX(-105%);
        transition: transform var(--dur-slow) var(--spring);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding-top: env(safe-area-inset-top, 0px);
      }
      .drawer.open { transform: translateX(0); }
      .drawer-head { display: flex; gap: 14px; padding: var(--x6) var(--x5) var(--x5); }
      .avatar {
        width: 60px; height: 60px;
        flex: none;
        border-radius: var(--r-md);
        background: var(--fill);
        color: var(--label-2);
        display: flex; align-items: center; justify-content: center;
      }
      .who { min-width: 0; display: flex; flex-direction: column; gap: 3px; align-items: flex-start; justify-content: center; }
      .uname { font-size: 19px; }
      .school { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .stats {
        margin: 0 var(--x4) var(--x2);
        background: var(--fill);
        border-radius: var(--r-md);
        padding: var(--x4) var(--x3);
        display: flex;
        align-items: center;
      }
      .stat { flex: 1; text-align: center; }
      .sval { font-family: var(--font-display); font-size: 21px; font-weight: 700; letter-spacing: -0.5px; }
      .vdiv { width: 0.5px; height: 38px; margin: 0 6px; background: var(--separator); }
      .drawer-body { flex: 1; overflow-y: auto; padding: var(--x2) var(--x4) var(--x5); }
      .dsection {
        background: var(--fill);
        border-radius: var(--r-md);
        overflow: hidden;
        margin-bottom: var(--x3);
      }
      .ditem {
        display: flex;
        align-items: center;
        gap: var(--x3);
        padding: 11px 14px;
        cursor: pointer;
      }
      .ditem:not(:last-child) { border-bottom: 0.5px solid var(--separator); }
      .ditem:active { background: rgba(228, 234, 242, 0.5); }
      .dicon {
        width: 28px;
        display: inline-flex;
        justify-content: center;
        color: var(--label-2);
        flex: none;
      }
      .dicon.danger, .dlabel.danger { color: var(--red); }
      .dlabel { flex: 1; font-weight: 500; }

      :host-context(.dark) .drawer {
        background: rgba(16, 19, 27, 0.92);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
      }
      :host-context(.dark) .ditem:active { background: rgba(255, 255, 255, 0.06); }
      :host-context(.dark) .scrim { background: rgba(0, 0, 0, 0.55); }

      .tabbar-wrap {
        position: fixed;
        left: var(--x6); right: var(--x6);
        bottom: calc(10px + env(safe-area-inset-bottom, 0px));
        z-index: 50;
        display: flex;
        justify-content: center;
      }
      .tabbar {
        display: flex;
        width: 100%;
        max-width: 380px;
        padding: 6px;
        border-radius: var(--r-pill);
        /* Liquid Glass: sticlă pură — blur-ul e singurul material */
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.14),
          rgba(255, 255, 255, 0.05)
        );
        -webkit-backdrop-filter: blur(24px) saturate(1.9);
        backdrop-filter: blur(24px) saturate(1.9);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow:
          0 12px 32px rgba(14, 27, 58, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.5),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1);
      }
      .tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 8px 0 7px;
        border: none;
        border-radius: var(--r-pill);
        background: transparent;
        color: var(--label-2);
        cursor: pointer;
        /* comutare crocantă, fără bounce — ca tab bar-ul din iOS */
        transition:
          background 160ms ease-out,
          color 160ms ease-out,
          opacity 120ms ease-out;
      }
      .tab:active { opacity: 0.55; }
      .tab.active {
        /* pastilă de sticlă discretă peste sticla barei */
        background: rgba(255, 255, 255, 0.38);
        color: var(--blue);
        box-shadow:
          0 2px 10px rgba(14, 27, 58, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.7),
          inset 0 0 0 0.5px rgba(255, 255, 255, 0.45);
      }
      .tlabel { font-size: 10.5px; font-weight: 500; letter-spacing: 0.1px; }
      .tab.active .tlabel { font-weight: 700; }

      :host-context(.dark) .tabbar {
        background: linear-gradient(180deg, rgba(30, 34, 46, 0.4), rgba(30, 34, 46, 0.2));
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow:
          0 12px 32px rgba(0, 0, 0, 0.45),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }
      :host-context(.dark) .tab.active {
        background: rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
      }

      /* Pe desktop, chrome-ul de mobil dispare — sidebar-ul îl înlocuiește */
      @media (min-width: 960px) {
        .tabbar-wrap,
        .scrim,
        .drawer { display: none !important; }
      }
    `,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);
  private settings = inject(AppSettingsService);

  readonly menuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly tabs = [
    { icon: 'house', label: 'Acasă', route: '/home' },
    { icon: 'shuffle', label: 'Random', route: '/random' },
    { icon: 'person-circle', label: 'Profil', route: '/profile' },
  ];

  readonly sections: DrawerEntry[][] = [
    [
      { icon: 'person-circle', label: 'Profil utilizator', route: '/user-profile' },
      { icon: 'clock', label: 'Istoric sesiuni', route: '/history' },
    ],
    [
      { icon: 'chat', label: 'Mesaje dezvoltator', route: '/dev-messages' },
      { icon: 'gear', label: 'Setări', route: '/settings' },
    ],
    [
      { icon: 'star', label: 'Evaluează aplicația', route: '/rating' },
      { icon: 'info-circle', label: 'Despre BacPro', route: '/about' },
    ],
  ];

  /** Grupare pentru sidebar-ul de desktop (cu etichete de secțiune). */
  readonly sidebarGroups: { label: string; items: DrawerEntry[] }[] = [
    {
      label: 'Cont',
      items: [
        { icon: 'person-circle', label: 'Profil utilizator', route: '/user-profile' },
        { icon: 'clock', label: 'Istoric sesiuni', route: '/history' },
        { icon: 'chat', label: 'Mesaje dezvoltator', route: '/dev-messages' },
      ],
    },
    {
      label: 'Aplicație',
      items: [
        { icon: 'gear', label: 'Setări', route: '/settings' },
        { icon: 'star', label: 'Evaluează', route: '/rating' },
        { icon: 'info-circle', label: 'Despre BacPro', route: '/about' },
      ],
    },
  ];

  private profileSig = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchProfile(user) : null;
  });
  readonly profile = computed(() => {
    const sig = this.profileSig();
    return sig ? sig() : profileDefaults({ uid: '', email: null, displayName: null });
  });

  private sessionsSig = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchSessions(user) : null;
  });
  readonly progress = computed(() => progressFromSessions(this.sessionsSig()?.() ?? []));

  constructor() {
    const user = this.auth.currentUser;
    if (user) {
      this.firestore.ensureUserDocument(user).catch(() => {});
    }
    // Sincronizează setarea de haptics din profil (ca în MainShell.initState).
    effect(() => {
      const sig = this.profileSig();
      if (sig) this.settings.setHaptics(sig().haptics);
    });
    this.router.events.subscribe(() => this.currentUrl.set(this.router.url));
  }

  readonly onHome = computed(() => this.currentUrl().startsWith('/home'));

  /** Rutele care afișează tab bar-ul pe mobil (restul sunt vederi „push"). */
  readonly isTabRoute = computed(() => {
    const u = this.currentUrl().split('?')[0].split('#')[0];
    return u === '/home' || u === '/random' || u === '/profile' || u === '/';
  });

  isActive(route: string): boolean {
    return this.currentUrl().startsWith(route);
  }

  goTab(route: string): void {
    this.settings.selection();
    this.menuOpen.set(false);
    this.router.navigateByUrl(route);
  }

  openMenu(): void {
    this.settings.medium();
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  go(route: string): void {
    this.settings.selection();
    this.menuOpen.set(false);
    this.router.navigateByUrl(route);
  }

  async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  formatHours(seconds: number): string {
    const hours = Math.trunc(seconds / 3600);
    const minutes = Math.trunc((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h`;
  }
}
