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
          <!-- Profile Header (Apple ID Style) -->
          <div class="drawer-head">
            <div class="avatar">
              <app-icon name="person-fill" [size]="28" />
            </div>
            <div class="who">
              <div class="uname">{{ auth.displayName }}</div>
              <div class="school">
                {{ profile().school === 'Adaugă școala ta' ? 'Adaugă liceul tău' : profile().school }} · {{ profile().selectedProfile }}
              </div>
            </div>
          </div>

          <!-- Quick Stats Grouped Card -->
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

          <!-- iOS Grouped Navigation List -->
          <nav class="drawer-body">
            @for (section of sections; track $index) {
              <div class="dgroup">
                @if ($index === 0) {
                  <div class="dsection-title">CONT</div>
                } @else if ($index === 1) {
                  <div class="dsection-title">APLICAȚIE</div>
                } @else if ($index === 2) {
                  <div class="dsection-title">DESPRE</div>
                }
                <div class="dsection">
                  @for (entry of section; track entry.label) {
                    <div class="ditem pressable" (click)="go(entry.route)">
                      <span class="dicon"><app-icon [name]="entry.icon" [size]="20" /></span>
                      <span class="dlabel">{{ entry.label }}</span>
                      <app-icon name="chevron-right" [size]="13" class="dchevron" />
                    </div>
                  }
                </div>
              </div>
            }

            <div class="dgroup">
              <div class="dsection-title">SESIUNE</div>
              <div class="dsection">
                <div class="ditem pressable" (click)="signOut()">
                  <span class="dicon danger"><app-icon name="logout" [size]="20" /></span>
                  <span class="dlabel danger">Deconectează-te</span>
                  <app-icon name="chevron-right" [size]="13" class="dchevron danger" />
                </div>
              </div>
            </div>
          </nav>
        </aside>
      }

      <!-- Tab bar glass flotant (mobil, doar pe taburi) -->
      @if (isTabRoute()) {
      <svg style="display: none; position: absolute;">
        <filter id="glass-distortion">
          <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="77" />
        </filter>
      </svg>
      <nav class="tabbar-wrap">
        <div class="tabbar">
          <div class="glass-filter"></div>
          <div class="glass-overlay"></div>
          <div class="glass-specular"></div>
          <div class="glass-content">
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
          top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w);
          z-index: 70;
          padding: 36px 12px 16px;
          background: var(--surface);
          border-right: 0.5px solid var(--separator);
          border-radius: 0;
          box-shadow: none;
        }
      }
      .sb-brand { display: flex; align-items: center; gap: 10px; padding: 0 10px 20px; }
      .sb-logo { width: 28px; height: 28px; border-radius: 7px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
      .sb-name { font-family: var(--font-display); font-size: 16px; font-weight: 700; letter-spacing: -0.3px; color: var(--label); }
      .sb-nav { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
      .sb-group { display: flex; flex-direction: column; gap: 2px; }
      .sb-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.2px;
        color: var(--label-3);
        padding: 0 10px;
        margin-bottom: 4px;
      }
      .sb-item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 6px 10px;
        border: none;
        background: transparent;
        border-radius: 6px;
        color: var(--label-2);
        font-size: 13.5px;
        font-weight: 400;
        letter-spacing: -0.15px;
        text-align: left;
        cursor: pointer;
        transition: background 100ms ease-out, color 100ms ease-out;
      }
      .sb-item span { flex: 1; }
      .sb-item:hover { background: rgba(0, 0, 0, 0.04); color: var(--label); }
      .sb-item:active { background: rgba(0, 0, 0, 0.08); }
      .sb-item.active { background: var(--blue); color: #ffffff; font-weight: 500; }
      .sb-item.active app-icon { color: #ffffff; }
      .sb-item.danger { color: var(--red); }
      .sb-item.danger:hover { background: rgba(255, 59, 48, 0.08); }
      .sb-foot { padding-top: 12px; border-top: 0.5px solid var(--separator); }
      .sb-user { display: flex; align-items: center; gap: 10px; padding: 4px 8px 8px; }
      .sb-avatar {
        width: 32px; height: 32px;
        flex: none;
        border-radius: 50%;
        background: var(--fill);
        color: var(--label-2);
        display: flex; align-items: center; justify-content: center;
      }
      .sb-uinfo { min-width: 0; }
      .sb-uname { font-size: 13px; font-weight: 600; color: var(--label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sb-uemail { font-size: 11px; color: var(--label-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      :host-context(.dark) .sidebar {
        background: var(--surface);
        border-right-color: rgba(255, 255, 255, 0.08);
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
        width: 86%;
        max-width: 360px;
        background: var(--bg); /* systemGroupedBackground */
        border-radius: 0 24px 24px 0;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        transform: translateX(-100%);
        transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding-top: env(safe-area-inset-top, 0px);
      }
      .drawer.open { transform: translateX(0); }

      /* Profile Header (Apple ID style) */
      .drawer-head {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 18px 18px;
      }
      .avatar {
        width: 58px;
        height: 58px;
        flex: none;
        border-radius: 50%;
        background: var(--fill-secondary);
        color: var(--label-2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .who {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .uname {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -0.4px;
        color: var(--label);
      }
      .school {
        font-size: 13px;
        color: var(--label-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Quick Stats Grouped Card */
      .stats {
        margin: 0 16px 20px;
        background: var(--surface); /* secondarySystemGroupedBackground */
        border-radius: 18px;
        padding: 14px 12px;
        display: flex;
        align-items: center;
        box-shadow: inset 0 0 0 0.5px var(--hairline);
      }
      .stat { flex: 1; text-align: center; }
      .sval {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.4px;
        color: var(--label);
      }
      .vdiv {
        width: 0.5px;
        height: 28px;
        background: var(--separator);
      }

      /* Navigation Body & Grouped Sections (iOS Settings style) */
      .drawer-body {
        flex: 1;
        overflow-y: auto;
        padding: 0 16px 32px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .dgroup {
        display: flex;
        flex-direction: column;
      }
      .dsection-title {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.2px;
        color: var(--label-2);
        margin: 0 0 6px 12px;
        text-transform: uppercase;
      }
      .dsection {
        background: var(--surface); /* secondarySystemGroupedBackground */
        border-radius: 18px;
        overflow: hidden;
        box-shadow: inset 0 0 0 0.5px var(--hairline);
      }
      .ditem {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 54px;
        padding: 0 16px;
        cursor: pointer;
        background: transparent;
        transition: background 120ms ease-out;
      }
      .ditem:not(:last-child) {
        border-bottom: 0.5px solid var(--separator);
      }
      .ditem:active {
        background: rgba(0, 0, 0, 0.05);
      }
      :host-context(.dark) .ditem:active {
        background: rgba(255, 255, 255, 0.08);
      }
      .dicon {
        width: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--label-2);
        flex: none;
      }
      .dicon.danger {
        color: var(--red);
      }
      .dlabel {
        flex: 1;
        font-size: 16px;
        font-weight: 400;
        letter-spacing: -0.2px;
        color: var(--label);
      }
      .dlabel.danger {
        color: var(--red);
      }
      .dchevron {
        color: var(--label-3);
        flex: none;
      }
      .dchevron.danger {
        color: var(--red);
        opacity: 0.6;
      }

      :host-context(.dark) .drawer {
        background: var(--bg);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }
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
        --bg-color: rgba(255, 255, 255, 0.25);
        --highlight: rgba(255, 255, 255, 0.75);
        position: relative;
        width: 100%;
        max-width: 380px;
        border-radius: var(--r-pill);
        overflow: hidden;
        background: transparent;
      }
      .glass-filter, .glass-overlay, .glass-specular {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
      }
      .glass-filter {
        z-index: 1;
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
        filter: url(#glass-distortion) saturate(120%) brightness(1.15);
      }
      .glass-overlay {
        z-index: 2;
        background: var(--bg-color);
      }
      .glass-specular {
        z-index: 3;
        box-shadow: inset 1px 1px 1px var(--highlight);
      }
      .glass-content {
        position: relative;
        z-index: 4;
        padding: 6px;
        display: flex;
        justify-content: center;
        width: 100%;
      }
      .tab {
        position: relative;
        z-index: 1;
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
        transition: background-color 0.2s ease, color 160ms ease-out, opacity 120ms ease-out;
      }
      .tab:hover { background-color: rgba(255, 255, 255, 0.1); }
      .tab:active { opacity: 0.55; }
      .tab.active {
        background-color: rgba(255, 255, 255, 0.2);
        color: var(--label);
      }
      .tlabel { font-size: 10.5px; font-weight: 500; letter-spacing: 0.1px; }
      .tab.active .tlabel { font-weight: 700; }

      :host-context(.dark) .tabbar {
        --bg-color: rgba(0, 0, 0, 0.25);
        --highlight: rgba(255, 255, 255, 0.15);
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
