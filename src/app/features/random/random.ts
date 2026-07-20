/** Tab-ul Random — port al RandomSubjectScreen din main_shell.dart. */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { Profile, appProfiles, examSessions, examYears, profileByName } from '../../core/models/catalog';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  AppButtonComponent,
  GlassHeaderComponent,
  PillBadgeComponent,
  TintedIconComponent,
} from '../../ui/ui';
import { slug as slugify } from '../subjects/subject-routing';

interface RandomPick {
  profileName: string;
  subjectName: string;
  year: string;
  sessionName: string;
  subjectIcon: string;
  subjectColor: string;
  sessionColor: string;
}

@Component({
  selector: 'app-random',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, GlassHeaderComponent, PillBadgeComponent, TintedIconComponent],
  template: `
    <app-glass-header title="Subiect Random" [showBack]="false" />
    <div class="page-scroll">
      <div class="page-pad content">
        <div class="floating-card pick-card">
          @if (pick(); as p) {
            <div class="prow">
              <app-tinted-icon [icon]="p.subjectIcon" [color]="p.subjectColor" [size]="54" />
              <div class="ptexts">
                <div class="t-title">{{ p.subjectName }}</div>
                <div class="t-subhead">{{ p.profileName }} · {{ p.year }}</div>
              </div>
            </div>
            <div class="pill-row">
              <app-pill-badge [label]="p.sessionName" [color]="p.sessionColor" />
            </div>
          } @else {
            <div class="center-fill" style="min-height: 80px"><span class="spinner"></span></div>
          }
        </div>

        <app-button
          label="Generează alt subiect"
          icon="shuffle"
          btnStyle="secondary"
          (pressed)="reroll()"
        />
        <app-button
          label="Începe subiectul"
          icon="play-fill"
          [disabled]="pick() === null"
          (pressed)="start()"
        />
      </div>
      <div style="height: var(--tab-clearance)"></div>
    </div>
  `,
  styles: [
    `
      .content { padding-top: var(--x5); display: flex; flex-direction: column; gap: var(--x3); }
      .pick-card { border-radius: var(--r-xl); margin-bottom: var(--x2); }
      .prow { display: flex; align-items: center; gap: var(--x4); }
      .ptexts { min-width: 0; }
      .ptexts .t-subhead { margin-top: 3px; }
      .pill-row { margin-top: var(--x4); }
    `,
  ],
})
export class RandomComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);
  private settings = inject(AppSettingsService);

  readonly pick = signal<RandomPick | null>(null);
  private profile: Profile = appProfiles[0];

  private readonly selectedProfileName = computed(() => {
    const user = this.auth.user();
    return user ? this.firestore.watchProfile(user)().selectedProfile : null;
  });

  constructor() {
    // Pool-ul rămâne blocat pe profilul ales — re-alege la schimbare de profil.
    effect(() => {
      const resolved = profileByName(this.selectedProfileName());
      if (resolved.name !== this.profile.name || this.pick() === null) {
        this.profile = resolved;
        this.generate();
      }
    });
  }

  private generate(): void {
    const subjects = this.profile.subjects;
    if (subjects.length === 0) return;
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const year = examYears[Math.floor(Math.random() * examYears.length)];
    const session = examSessions[Math.floor(Math.random() * examSessions.length)];
    this.pick.set({
      profileName: this.profile.name,
      subjectName: subject.title,
      year,
      sessionName: session.name,
      subjectIcon: subject.icon,
      subjectColor: subject.accentColor,
      sessionColor: session.color,
    });
  }

  reroll(): void {
    this.settings.selection();
    this.generate();
  }

  start(): void {
    const p = this.pick();
    if (!p) return;
    this.settings.medium();
    this.router.navigate([
      '/subject', slugify(p.profileName), slugify(p.subjectName), p.year, slugify(p.sessionName),
    ]);
  }
}
