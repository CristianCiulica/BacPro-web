/** Tab-ul Random — utilizatorul alege materia, apoi primește un subiect
 *  (an + sesiune) aleator din catalogul profilului selectat. */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { Profile, examSessions, examYears, profileByName } from '../../core/models/catalog';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import {
  AppButtonComponent,
  GlassHeaderComponent,
  IconComponent,
  PillBadgeComponent,
} from '../../ui/ui';
import { slug as slugify } from '../subjects/subject-routing';

type SubjectEntry = Profile['subjects'][number];

interface RandomPick {
  year: string;
  sessionName: string;
  sessionColor: string;
}

@Component({
  selector: 'app-random',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, GlassHeaderComponent, IconComponent, PillBadgeComponent],
  template: `
    <app-glass-header title="Subiect Random" [showBack]="false" />
    <div class="page-scroll">
      <div class="page-pad content">
        <div class="t-section lbl">Alege materia</div>
        <div class="subj-picker">
          @for (s of subjects(); track s.title) {
            <button
              class="sp-tile"
              [class.sel]="selected()?.title === s.title"
              (click)="choose(s)"
            >
              <span class="sp-icon"><app-icon [name]="s.icon" [size]="22" /></span>
              <span class="sp-name">{{ s.title }}</span>
              @if (selected()?.title === s.title) {
                <span class="sp-check"><app-icon name="check-circle-fill" [size]="18" /></span>
              }
            </button>
          }
        </div>

        @if (selected(); as sub) {
          <div class="floating-card pick-card rise">
            <div class="prow">
              <span class="pick-icon"><app-icon [name]="sub.icon" [size]="26" /></span>
              <div class="ptexts">
                <div class="t-title">{{ sub.title }}</div>
                <div class="t-subhead">{{ profileName() }} · {{ pick().year }}</div>
              </div>
            </div>
            <div class="pill-row">
              <app-pill-badge [label]="pick().sessionName" />
            </div>
          </div>

          <app-button
            label="Generează alt subiect"
            icon="shuffle"
            btnStyle="subtle"
            (pressed)="reroll()"
          />
          <app-button label="Începe subiectul" icon="play-fill" btnStyle="mono" (pressed)="start()" />
        } @else {
          <div class="empty-hint">
            <app-icon name="shuffle" [size]="26" />
            <span>Alege o materie ca să primești un subiect aleator.</span>
          </div>
        }
      </div>
      <div style="height: var(--tab-clearance)"></div>
    </div>
  `,
  styles: [
    `
      .content { padding-top: var(--x5); display: flex; flex-direction: column; gap: var(--x3); }
      .lbl { padding: 0 2px var(--x1); }

      .subj-picker {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--x3);
        margin-bottom: var(--x2);
      }
      @media (min-width: 620px) {
        .subj-picker { grid-template-columns: repeat(3, 1fr); }
      }
      .sp-tile {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--x3);
        padding: 13px 14px;
        border: none;
        text-align: left;
        cursor: pointer;
        background: var(--surface);
        color: var(--label);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-soft), inset 0 0 0 0.5px var(--hairline);
        transition: box-shadow 160ms var(--ease), transform 120ms var(--ease);
      }
      .sp-tile:active { transform: scale(0.98); }
      .sp-tile.sel { box-shadow: inset 0 0 0 2px var(--label-2); }
      .sp-icon {
        width: 38px; height: 38px;
        flex: none;
        border-radius: 11px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .sp-name {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -0.2px;
        line-height: 1.15;
        min-width: 0;
        color: var(--label);
      }
      .sp-check {
        position: absolute;
        top: 8px; right: 8px;
        color: var(--label);
        display: inline-flex;
      }

      .pick-card { border-radius: var(--r-xl); margin: var(--x2) 0; }
      .prow { display: flex; align-items: center; gap: var(--x4); }
      .pick-icon {
        width: 54px; height: 54px;
        border-radius: 17px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
      .ptexts { min-width: 0; }
      .ptexts .t-subhead { margin-top: 3px; }
      .pill-row { margin-top: var(--x4); }

      .empty-hint {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--x3);
        text-align: center;
        color: var(--label-3);
        padding: var(--x7) var(--x5);
        font-size: 14px;
      }

    `,
  ],
})
export class RandomComponent {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);
  private settings = inject(AppSettingsService);

  private readonly profile = computed(() => {
    const user = this.auth.user();
    const name = user ? this.firestore.watchProfile(user)().selectedProfile : null;
    return profileByName(name);
  });
  readonly subjects = computed(() => this.profile().subjects);
  readonly profileName = computed(() => this.profile().name);

  readonly selected = signal<SubjectEntry | null>(null);
  readonly pick = signal<RandomPick>({ year: '', sessionName: '', sessionColor: '' });

  constructor() {
    // La schimbarea profilului, resetează selecția (materiile diferă).
    effect(() => {
      this.profile();
      this.selected.set(null);
    });
  }

  choose(subject: SubjectEntry): void {
    this.settings.selection();
    this.selected.set(subject);
    this.generate();
  }

  private generate(): void {
    const year = examYears[Math.floor(Math.random() * examYears.length)];
    const session = examSessions[Math.floor(Math.random() * examSessions.length)];
    this.pick.set({ year, sessionName: session.name, sessionColor: session.color });
  }

  reroll(): void {
    this.settings.selection();
    this.generate();
  }

  start(): void {
    const sub = this.selected();
    if (!sub) return;
    this.settings.medium();
    this.router.navigate([
      '/subject', slugify(this.profileName()), slugify(sub.title), this.pick().year, slugify(this.pick().sessionName),
    ]);
  }
}
