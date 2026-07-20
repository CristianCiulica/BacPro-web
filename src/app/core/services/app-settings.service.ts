/**
 * Port al lib/src/services/app_settings.dart — setarea de haptics în memorie
 * (persistată prin profilul Firestore, ca în aplicația mobilă) + AppHaptics.
 * Pe web, feedback-ul haptic folosește navigator.vibrate (Android); pe iOS
 * Safari nu există API — no-op, ca și cum setarea ar fi dezactivată.
 */
import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'bacpro_theme_v1';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  readonly darkMode = signal(localStorage.getItem(THEME_KEY) === 'dark');
  readonly haptics = signal(true);

  constructor() {
    this.applyTheme(this.darkMode());
  }

  /** Tema e per-dispozitiv (ca Appearance în iOS); persistată local și
   *  oglindită în profilul Firestore de către ecranul de Setări. */
  setDarkMode(value: boolean): void {
    this.darkMode.set(value);
    localStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    this.applyTheme(value);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0A0C12' : '#F4F6FB');
  }

  setHaptics(value: boolean): void {
    this.haptics.set(value);
  }

  private vibrate(ms: number): void {
    if (!this.haptics()) return;
    navigator.vibrate?.(ms);
  }

  selection(): void { this.vibrate(8); }
  light(): void { this.vibrate(12); }
  medium(): void { this.vibrate(20); }
  heavy(): void { this.vibrate(35); }
}
