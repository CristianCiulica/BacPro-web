/**
 * Ecranul de subiect — redesign „Cupertino" curat:
 * titlu mare fără card, timer monocrom, o singură culoare de accent (albastru),
 * autoevaluare pe slider liquid-glass gri. Timer 3h, Documente (Subiect/Barem),
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
import { LocalExamPdfService } from '../../core/services/local-exam-pdf.service';
import {
  AppButtonComponent,
  CardGroupComponent,
  DialogService,
  GlassHeaderComponent,
  SegmentedComponent,
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
    SegmentedComponent,
    PdfFullscreenComponent,
  ],
  template: `
    <app-glass-header title="" [large]="false" />
    <div class="page-scroll">
      <!-- Titlu curat, fără card -->
      <div class="page-pad title-block">
        <h1 class="stitle">{{ subjectName() }}</h1>
        <div class="ssub">{{ year() }} · {{ sessionName() }}</div>
      </div>

      <!-- Timer examen — monocrom, clean -->
      <div class="page-pad">
        <div class="floating-card timer">
          <div class="t-caption">Timp rămas</div>
          <div class="big-time">{{ formattedTime() }}</div>
          <div class="thinbar">
            <div class="thinbar-fill" [style.width.%]="timerProgress() * 100"></div>
          </div>
          <div class="tmeta">
            <span>{{ consumedLabel() }}% consumat</span>
            <span>{{ minutesLeft() }} min rămase</span>
          </div>
          <div class="tactions">
            @if (!examStarted()) {
              <app-button label="Start 3h" icon="play-fill" [height]="50" (pressed)="startTimer()" />
            } @else {
              <app-button
                label="Continuă"
                icon="play-fill"
                [height]="50"
                style="flex: 1"
                (pressed)="startTimer()"
              />
              <app-button
                label="Oprește"
                btnStyle="subtle"
                [height]="50"
                style="flex: 1"
                (pressed)="confirmStopExam()"
              />
            }
          </div>
        </div>
      </div>

      <!-- Documente oficiale -->
      <div class="page-pad" style="margin-top: var(--x4)">
        <div class="floating-card docs">
          <div class="docs-head">
            <div class="docs-titles">
              <div class="t-headline">Documente oficiale</div>
              <div class="t-caption docsub">{{ year() }} · {{ sessionName() }}</div>
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

      <!-- Autoevaluare — slider liquid glass -->
      <div class="page-pad" style="margin-top: var(--x6)">
        <div class="t-section section-header">Nota estimată</div>
        <div class="glass-panel grade-glass">
          <div class="grade-row">
            <span class="t-body">Autoevaluare</span>
            <span class="grade-badge">{{ estimatedGrade().toFixed(1) }}</span>
          </div>
          <input
            class="app-slider grade-slider"
            type="range"
            min="1"
            max="10"
            step="0.5"
            [ngModel]="estimatedGrade()"
            (ngModelChange)="setGrade($event)"
            [style.--pct.%]="((estimatedGrade() - 1) / 9) * 100"
            [style.--track-color]="'rgba(142, 152, 172, 0.7)'"
          />
          <div class="scale">
            <span class="t-caption">1</span>
            <span class="t-caption">5</span>
            <span class="t-caption">10</span>
          </div>
        </div>
      </div>

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
        <app-button label="Marchează ca rezolvat" icon="check" [height]="56" (pressed)="markSolved()" />
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
      /* Titlu — fără card, curat */
      .title-block { padding-top: var(--x4); padding-bottom: var(--x5); }
      .stitle {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(30px, 9vw, 40px);
        font-weight: 800;
        letter-spacing: -1px;
        line-height: 1.05;
        color: var(--label);
      }
      .ssub { margin-top: 6px; font-size: 15px; color: var(--label-2); }

      /* Timer — monocrom */
      .timer { text-align: left; }
      .big-time {
        margin-top: 2px;
        font-family: var(--font-display);
        font-size: 40px;
        font-weight: 800;
        letter-spacing: -1px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        color: var(--label);
      }
      .thinbar {
        margin-top: var(--x4);
        height: 6px;
        border-radius: var(--r-pill);
        background: var(--fill);
        overflow: hidden;
      }
      .thinbar-fill {
        height: 100%;
        min-width: 6px;
        border-radius: var(--r-pill);
        background: var(--label-3);
        transition: width var(--dur-base) var(--ease);
      }
      .tmeta {
        display: flex;
        justify-content: space-between;
        margin-top: var(--x2);
        font-size: 12px;
        color: var(--label-2);
      }
      .tactions { display: flex; gap: var(--x3); margin-top: var(--x4); }

      /* Documente */
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

      /* Autoevaluare — liquid glass gri, sheen discret (nu metalic) */
      .grade-glass {
        padding: var(--x5);
        background-image: linear-gradient(150deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 60%);
        border-color: var(--glass-stroke);
      }
      :host-context(.dark) .grade-glass {
        background-image: linear-gradient(150deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 60%);
      }
      /* thumb alb lucios, ca de sticlă */
      .grade-slider::-webkit-slider-thumb {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .grade-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--x4); }
      .grade-badge {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.6px;
        font-variant-numeric: tabular-nums;
        color: var(--label);
        background: rgba(120, 130, 150, 0.16);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        padding: 5px 16px;
        border-radius: var(--r-md);
        border: 0.5px solid var(--glass-stroke);
      }
      /* track puțin mai gros; culoarea gri vine inline pe --track-color */
      .grade-slider { --track-h: 7px; }
      .scale { display: flex; justify-content: space-between; margin-top: var(--x2); }

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

  ngOnInit(): void {
    const p = this.route.snapshot.params;
    const profile = findProfile(p['profile']);
    const subject = findSubject(profile, p['subject']);
    const session = findSession(p['session']);
    this.profileName.set(profile.name);
    this.subjectName.set(subject?.title ?? 'Subiect');
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

  readonly formattedTime = computed(() => {
    const s = this.secondsLeft();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(Math.trunc(s / 3600))}:${p(Math.trunc((s % 3600) / 60))}:${p(s % 60)}`;
  });
  readonly timerProgress = computed(() => (BAC_DURATION - this.secondsLeft()) / BAC_DURATION);
  readonly consumedLabel = computed(() => (this.timerProgress() * 100).toFixed(0));
  readonly minutesLeft = computed(() => Math.ceil(this.secondsLeft() / 60));

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
    await this.dialogs.show(
      'Subiect finalizat',
      'Subiectul a fost marcat ca rezolvat și salvat în istoricul tău.',
      [{ label: 'Gata', value: true }],
    );
    this.router.navigateByUrl('/home');
  }
}
