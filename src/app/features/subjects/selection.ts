/**
 * Alegerea anului și a sesiunii — port al YearSelectionScreen și
 * SessionSelectionScreen din main_shell.dart. Rutele folosesc slug-uri
 * (vezi subject-routing.ts); numele reale se rezolvă din catalog.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { examSessions, examYears } from '../../core/models/catalog';
import {
  CardGroupComponent,
  CardRowComponent,
  GlassHeaderComponent,
  SubjectTitleCardComponent,
  TintedIconComponent,
} from '../../ui/ui';
import { findProfile, findSubject, slug } from './subject-routing';

@Component({
  selector: 'app-year-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardGroupComponent,
    CardRowComponent,
    GlassHeaderComponent,
    SubjectTitleCardComponent,
    TintedIconComponent,
  ],
  template: `
    <app-glass-header title="" [large]="false" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x3)">
        <app-subject-title-card [title]="subjectTitle()" [accentColor]="color()" />
      </div>
      <app-card-group header="Alege anul" footer="Subiectele sunt disponibile din 2020.">
        @for (year of years; track year) {
          <app-card-row [title]="year" (rowTap)="openYear(year)">
            <app-tinted-icon slot="leading" icon="calendar" color="#5856D6" />
          </app-card-row>
        }
      </app-card-group>
      <div style="height: var(--x10)"></div>
    </div>
  `,
})
export class YearSelectionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly years = examYears;
  private params = toSignal(this.route.params, { initialValue: this.route.snapshot.params });
  readonly profile = computed(() => findProfile(this.params()['profile'] as string));
  readonly subject = computed(() =>
    findSubject(this.profile(), this.params()['subject'] as string),
  );
  readonly subjectTitle = computed(() => this.subject()?.title ?? 'Subiect');
  readonly color = computed(() => this.subject()?.accentColor ?? '#5856D6');

  openYear(year: string): void {
    this.router.navigate([
      '/subject', slug(this.profile().name), slug(this.subjectTitle()), year,
    ]);
  }
}

@Component({
  selector: 'app-session-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardGroupComponent,
    CardRowComponent,
    GlassHeaderComponent,
    SubjectTitleCardComponent,
    TintedIconComponent,
  ],
  template: `
    <app-glass-header title="" [large]="false" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x3)">
        <app-subject-title-card
          [title]="subjectTitle()"
          [subtitle]="'Anul ' + year()"
          [accentColor]="color()"
        />
      </div>
      <app-card-group header="Alege sesiunea">
        @for (session of sessions; track session.name) {
          <app-card-row
            [title]="session.name"
            [subtitle]="session.desc"
            (rowTap)="openSession(session.name)"
          >
            <app-tinted-icon slot="leading" [icon]="session.icon" [color]="session.color" />
          </app-card-row>
        }
      </app-card-group>
      <div style="height: var(--x10)"></div>
    </div>
  `,
})
export class SessionSelectionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly sessions = examSessions;
  private params = toSignal(this.route.params, { initialValue: this.route.snapshot.params });
  readonly profile = computed(() => findProfile(this.params()['profile'] as string));
  readonly subject = computed(() =>
    findSubject(this.profile(), this.params()['subject'] as string),
  );
  readonly subjectTitle = computed(() => this.subject()?.title ?? 'Subiect');
  readonly year = computed(() => this.params()['year'] as string);
  readonly color = computed(() => this.subject()?.accentColor ?? '#5856D6');

  openSession(sessionName: string): void {
    this.router.navigate([
      '/subject', slug(this.profile().name), slug(this.subjectTitle()), this.year(), slug(sessionName),
    ]);
  }
}
