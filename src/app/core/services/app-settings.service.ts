/**
 * Port al lib/src/services/app_settings.dart — setarea de haptics în memorie
 * (persistată prin profilul Firestore, ca în aplicația mobilă) + AppHaptics.
 * Pe web, feedback-ul haptic folosește navigator.vibrate (Android); pe iOS
 * Safari nu există API — no-op, ca și cum setarea ar fi dezactivată.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  readonly darkMode = signal(false);
  readonly haptics = signal(true);

  setDarkMode(value: boolean): void {
    this.darkMode.set(value);
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
