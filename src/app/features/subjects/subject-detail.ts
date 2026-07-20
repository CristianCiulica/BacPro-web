/**
 * Ecranul de subiect — port al SubjectDetailScreen din main_shell.dart:
 * timer de examen 3h, Documente oficiale (Subiect/Barem), Nota estimată,
 * Note personale, „Marchează ca rezolvat".
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { ExamPdfAssets } from '../../core/models/profile-data';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { GamificationService } from '../../core/services/gamification.service';
import { LocalExamPdfService } from '../../core/services/local-exam-pdf.service';
import {
  AppButtonComponent,
  CardGroupComponent,
  DialogService,
  GlassHeaderComponent,
  PillBadgeComponent,
  ProgressBarComponent,
  SegmentedComponent,
  SubjectTitleCardComponent,
  TintedIconComponent,
  tint,
} from '../../ui/ui';
import { ExamFullscreenResult, PdfFullscreenComponent } from './pdf-fullscreen';
import { findProfile, findSession, findSubject } from './subject-routing';

const BAC_DURATION = 10800; // 3 ore

@Component({
  selector: 'app-subject-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AppButtonComponent,
    CardGroupComponent,
    GlassHeaderComponent,
    PillBadgeComponent,
    ProgressBarComponent,
    SegmentedComponent,
    SubjectTitleCardComponent,
    TintedIconComponent,
    PdfFullscreenComponent,
  ],
  template: `
    <app-glass-header title="" [large]="false" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x3)">
        <app-subject-title-card
          [title]="subjectName()"
          [subtitle]="year() + ' · ' + sessionName()"
          [accentColor]="subjectColor()"
        />
      </div>

      <!-- Timer examen -->
      <div class="page-pad" style="margin-top: var(--x4)">
        <div class="floating-card">
          <div class="trow">
            <app-tinted-icon icon="timer" [color]="timerColorHex()" [size]="36" />
            <div class="ttexts">
              <div class="t-caption">Timer examen</div>
              <div class="ttime" [style.color]="timerColorHex()">{{ formattedTime() }}</div>
            </div>
            <app-pill-badge [label]="timerStatusLabel()" [color]="timerColorHex()" />
          </div>
          <div style="margin-top: var(--x4)">
            <app-progress-bar [value]="timerProgress()" [color]="timerColorHex()" />
          </div>
          <div class="tmeta">
            <span class="t-caption grow">{{ consumedLabel() }}% consumat</span>
            <span class="t-caption">{{ minutesLeft() }} min rămase</span>
          </div>
          <div class="tactions">
            <app-button
              [label]="secondsLeft() === bacDuration ? 'Start 3h' : 'Continuă fullscreen'"
              icon="play-fill"
              accent="#34C759"
              [height]="48"
              style="flex: 1"
              (pressed)="startTimer()"
            />
            <app-button
              label="Oprește"
              btnStyle="destructive"
              [expanded]="false"
              [height]="48"
              class="inline-host"
              [disabled]="!examStarted()"
              (pressed)="confirmStopExam()"
            />
          </div>
        </div>
      </div>

      <!-- Documente oficiale -->
      <div class="page-pad" style="margin-top: var(--x4)">
        <div class="floating-card docs">
          <div class="docs-head">
            <div class="docs-titles">
              <div class="t-headline">Documente oficiale</div>
              <div class="t-caption docsub">
                {{ subjectName() }} · {{ year() }} · {{ sessionName() }}
              </div>
            </div>
            <app-segmented
              [options]="['Subiect', 'Barem']"
              [index]="showAnswerKey() ? 1 : 0"
              (indexChange)="showAnswerKey.set($event === 1)"
            />
          </div>
          <div class="docs-divider"></div>
          <div class="docs-body">
            @if (pdfLoading()) {
              <div class="docs-loading"><span class="spinner"></span></div>
            } @else if (pdfError()) {
              <div class="t-subhead center-text">{{ pdfError() }}</div>
            } @else if (!activePdfPath()) {
              <div class="t-subhead center-text">
                Nu există document disponibil pentru această selecție.
              </div>
            } @else {
              <app-button
                label="Previzualizare"
                icon="doc-viewfinder"
                btnStyle="secondary"
                [height]="48"
                (pressed)="openPreview()"
              />
            }
          </div>
        </div>
      </div>

      <!-- Nota estimată -->
      <app-card-group header="Nota estimată">
        <div class="grade-cell">
          <div class="grade-row">
            <span class="t-body">Autoevaluare</span>
            <span
              class="grade-badge"
              [style.background]="tint(gradeColorHex())"
              [style.color]="gradeColorHex()"
            >{{ estimatedGrade().toFixed(1) }}</span>
          </div>
          <input
            class="app-slider"
            type="range"
            min="1"
            max="10"
            step="0.5"
            [ngModel]="estimatedGrade()"
            (ngModelChange)="setGrade($event)"
            [style.--track-color]="gradeColorHex()"
            [style.--track-h]="'5px'"
            [style.--pct.%]="((estimatedGrade() - 1) / 9) * 100"
          />
          <div class="scale">
            <span class="t-caption">1</span>
            <span class="t-caption">5</span>
            <span class="t-caption">10</span>
          </div>
        </div>
      </app-card-group>

      <!-- Note personale -->
      <app-card-group header="Note personale">
        <div class="notes-cell">
          <div class="app-input multiline">
            <textarea
              rows="5"
              placeholder="Adaugă observații, formule de reținut, puncte slabe..."
              [(ngModel)]="notes"
              (focus)="editingNotes.set(true)"
            ></textarea>
          </div>
          @if (editingNotes()) {
            <div class="notes-save">
              <app-button
                label="Salvează"
                btnStyle="secondary"
                [expanded]="false"
                [height]="40"
                class="inline-host"
                (pressed)="editingNotes.set(false)"
              />
            </div>
          }
        </div>
      </app-card-group>

      <div class="page-pad finish">
        <app-button
          label="Marchează ca rezolvat"
          icon="check"
          [height]="56"
          (pressed)="markSolved()"
        />
      </div>
      <div style="height: var(--x5)"></div>
    </div>

    @if (fullscreen(); as fs) {
      <app-pdf-fullscreen
        [src]="fs.src"
        [title]="subjectName()"
        [examMode]="fs.examMode"
        [initialSecondsLeft]="secondsLeft()"
        [totalDurationSeconds]="bacDuration"
        (closed)="onFullscreenClosed($event, fs.examMode)"
      />
    }
  `,
  styles: [
    `
      .trow { display: flex; align-items: center; gap: var(--x3); }
      .ttexts { flex: 1; min-width: 0; }
      .ttime {
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.4px;
        font-variant-numeric: tabular-nums;
        margin-top: 1px;
      }
      .tmeta { display: flex; margin-top: var(--x2); }
      .grow { flex: 1; }
      .tactions { display: flex; gap: var(--x3); margin-top: var(--x4); }
      .docs { padding: 0; }
      .docs-head {
        display: flex;
        align-items: center;
        gap: var(--x3);
        padding: var(--x4) var(--x4) var(--x3);
        flex-wrap: wrap;
      }
      .docs-titles { flex: 1; min-width: 140px; }
      .docsub { margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .docs-divider { height: 0.5px; background: var(--separator); }
      .docs-body { padding: var(--x4); }
      .docs-loading { height: 44px; display: flex; align-items: center; justify-content: center; }
      .center-text { text-align: center; }
      .grade-cell { padding: var(--x4); }
      .grade-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--x2); }
      .grade-badge {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.5px;
        padding: 5px 14px;
        border-radius: var(--r-sm);
      }
      .scale { display: flex; justify-content: space-between; }
      .notes-cell { padding: var(--x4); }
      .notes-save { display: flex; justify-content: flex-end; margin-top: var(--x3); }
      .finish { margin-top: var(--x6); }
    `,
  ],
})
export class SubjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private gamification = inject(GamificationService);
  private localPdf = inject(LocalExamPdfService);
  private dialogs = inject(DialogService);
  private settings = inject(AppSettingsService);

  readonly bacDuration = BAC_DURATION;
  readonly secondsLeft = signal(BAC_DURATION);
  readonly timerFinished = signal(false);
  readonly examStarted = signal(false);
  readonly estimatedGrade = signal(7.0);
  readonly showAnswerKey = signal(false);
  readonly editingNotes = signal(false);
  readonly pdfLoading = signal(true);
  readonly pdfError = signal<string | null>(null);
  readonly pdfAssets = signal<ExamPdfAssets | null>(null);
  readonly fullscreen = signal<{ src: string; examMode: boolean } | null>(null);
  notes = '';

  readonly profileName = signal('');
  readonly subjectName = signal('');
  readonly year = signal('');
  readonly sessionName = signal('');
  readonly subjectColor = signal('#5856D6');

  tint = tint;

  ngOnInit(): void {
    const p = this.route.snapshot.params;
    const profile = findProfile(p['profile']);
    const subject = findSubject(profile, p['subject']);
    const session = findSession(p['session']);
    this.profileName.set(profile.name);
    this.subjectName.set(subject?.title ?? 'Subiect');
    this.subjectColor.set(subject?.accentColor ?? '#5856D6');
    this.year.set(p['year']);
    this.sessionName.set(session?.name ?? p['session']);
    this.loadPdfAssets();
  }

  private async loadPdfAssets(): Promise<void> {
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    let assets: ExamPdfAssets | null = null;
    try {
      assets = await this.localPdf.resolve({
        profile: this.profileName(),
        subject: this.subjectName(),
        year: this.year(),
        session: this.sessionName(),
      });
    } catch {
      assets = null;
    }
    this.pdfAssets.set(assets);
    this.pdfLoading.set(false);
    this.pdfError.set(
      assets === null ? 'Nu am găsit document asociat pentru această selecție.' : null,
    );
  }

  readonly activePdfPath = computed(() => {
    const assets = this.pdfAssets();
    if (!assets) return null;
    const path = this.showAnswerKey() ? assets.answerPdfAsset : assets.subjectPdfAsset;
    return path.trim() === '' ? null : path;
  });

  /* Timer — praguri și etichete identice cu aplicația mobilă. */
  readonly formattedTime = computed(() => {
    const s = this.secondsLeft();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(Math.trunc(s / 3600))}:${p(Math.trunc((s % 3600) / 60))}:${p(s % 60)}`;
  });
  readonly timerProgress = computed(() => (BAC_DURATION - this.secondsLeft()) / BAC_DURATION);
  readonly consumedLabel = computed(() => (this.timerProgress() * 100).toFixed(0));
  readonly minutesLeft = computed(() => Math.ceil(this.secondsLeft() / 60));
  readonly timerColorHex = computed(() => {
    const s = this.secondsLeft();
    if (s > 3600) return '#34C759';
    if (s > 900) return '#FF9500';
    return '#FF3B30';
  });
  timerStatusLabel(): string {
    if (this.timerFinished()) return 'Finalizat';
    if (this.secondsLeft() < BAC_DURATION) return 'În desfășurare';
    return 'Pregătit';
  }

  readonly gradeColorHex = computed(() => {
    const g = this.estimatedGrade();
    if (g >= 8.5) return '#34C759';
    if (g >= 5) return '#FF9500';
    return '#FF3B30';
  });

  setGrade(value: number): void {
    this.settings.selection();
    this.estimatedGrade.set(Number(value));
  }

  async startTimer(): Promise<void> {
    const pdfPath = this.pdfAssets()?.subjectPdfAsset;
    if (!pdfPath || pdfPath.trim() === '') {
      await this.dialogs.show(
        'Subiect indisponibil',
        'Nu am găsit acest subiect pentru selecția curentă. Încearcă alt an sau altă materie.',
        [{ label: 'Închide', value: true }],
      );
      return;
    }
    this.settings.medium();
    this.examStarted.set(true);
    this.fullscreen.set({ src: pdfPath, examMode: true });
  }

  openPreview(): void {
    const path = this.activePdfPath();
    if (!path) return;
    this.fullscreen.set({ src: path, examMode: false });
  }

  onFullscreenClosed(result: ExamFullscreenResult, wasExam: boolean): void {
    this.fullscreen.set(null);
    if (!wasExam) return;
    this.secondsLeft.set(result.secondsLeft);
    this.timerFinished.set(result.isFinished);
    this.examStarted.set(this.secondsLeft() < BAC_DURATION);
  }

  async confirmStopExam(): Promise<void> {
    const shouldStop = await this.dialogs.confirm(
      'Oprești rezolvarea?',
      'Vrei să oprești acum rezolvarea subiectului? Progresul timerului va fi resetat.',
      'Oprește',
      'Continuă',
      true,
    );
    if (!shouldStop) return;
    this.secondsLeft.set(BAC_DURATION);
    this.timerFinished.set(false);
    this.examStarted.set(false);
    this.location.back();
  }

  async markSolved(): Promise<void> {
    this.settings.heavy();
    const user = this.auth.currentUser;
    const cleanNotes = this.notes.trim();
    if (user) {
      await this.firestore.addSession(user, {
        subjectName: this.subjectName(),
        year: this.year(),
        sessionName: this.sessionName(),
        durationSeconds: BAC_DURATION - this.secondsLeft(),
        estimatedGrade: this.estimatedGrade(),
        notes: cleanNotes,
        completedAt: new Date(),
      });
    }
    await this.gamification.recordStudySessionCompleted(
      new Date(),
      this.sessionName().toLowerCase().includes('simulare'),
    );
    await this.dialogs.show(
      'Subiect finalizat',
      'Subiectul a fost marcat ca rezolvat și salvat în istoricul tău.',
      [{ label: 'Gata', value: true }],
    );
    this.router.navigateByUrl('/home');
  }
}
