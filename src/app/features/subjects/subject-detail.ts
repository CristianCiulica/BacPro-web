/**
 * Subject Detail — iOS native feel.
 *
 * Layout modelled after Apple Health / Fitness / Settings:
 * - systemGroupedBackground canvas
 * - Grouped inset cards (secondarySystemGroupedBackground)
 * - Apple typography hierarchy (Large Title → Headline → Body → Caption)
 * - Generous 8pt-grid spacing
 * - Minimal shadows — rely on contrast & spacing
 * - Timer as hero element (Fitness-style large digits)
 * - iOS-native slider proportions
 * - Plain / tinted text buttons instead of Material filled buttons
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
  DialogService,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';
import { ExamFullscreenResult, PdfFullscreenComponent } from './pdf-fullscreen';
import { findProfile, findSession, findSubject } from './subject-routing';

const BAC_DURATION = 10800;

@Component({
  selector: 'app-subject-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    GlassHeaderComponent,
    IconComponent,
    PdfFullscreenComponent,
  ],
  template: `
    <app-glass-header title="" [large]="false" />
    <div class="page-scroll page-pad">

      <!-- ─── Large Title ─── -->
      <div class="hero">
        <div class="meta">{{ year() }} · {{ sessionName() }}</div>
        <h1 class="large-title">{{ subjectName() }}</h1>
      </div>

      <!-- ═══ TIMER ═══ -->
      <section class="group">
        <div class="group-header">MOD EXAMEN</div>
        <div class="card">
          <div class="timer-cell">
            <div class="timer-row">
              <div class="timer-digits">{{ formattedTime() }}</div>
              @if (examStarted()) {
                <span class="live-pill">Activ</span>
              }
            </div>
            <div class="thin-track">
              <div class="thin-fill" [style.width.%]="timerProgress() * 100"></div>
            </div>
            <div class="timer-meta">
              <span>{{ consumedLabel() }}% parcurs</span>
              <span>{{ minutesLeft() }} min</span>
            </div>
          </div>

          <div class="separator inset"></div>

          <div class="action-cell">
            @if (!examStarted()) {
              <button class="ios-btn filled" (click)="startTimer()">
                <app-icon name="play-fill" [size]="16" />
                <span>Start examen</span>
              </button>
            } @else {
              <div class="btn-pair">
                <button class="ios-btn filled flex-1" (click)="startTimer()">
                  <app-icon name="play-fill" [size]="16" />
                  <span>Continuă</span>
                </button>
                <button class="ios-btn tinted-destructive flex-1" (click)="confirmStopExam()">
                  Oprește
                </button>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ═══ DOCUMENTE ═══ -->
      <section class="group">
        <div class="group-header">DOCUMENTE OFICIALE</div>
        <div class="card">
          @if (pdfLoading()) {
            <div class="center-cell">
              <span class="spinner"></span>
            </div>
          } @else if (pdfError()) {
            <div class="center-cell muted">
              {{ pdfError() }}
            </div>
          } @else {
            <!-- Subiect -->
            <button
              class="row"
              [class.disabled]="!subjectPdfPath()"
              (click)="openSubjectPdf()"
            >
              <div class="row-icon">
                <app-icon name="doc-text" [size]="20" />
              </div>
              <div class="row-body">
                <span class="row-title">Subiect</span>
                <span class="row-subtitle">Varianta oficială</span>
              </div>
              <app-icon name="chevron-right" [size]="14" />
            </button>

            <div class="separator inset"></div>

            <!-- Barem -->
            <button
              class="row"
              [class.disabled]="!baremPdfPath()"
              (click)="openBaremPdf()"
            >
              <div class="row-icon">
                <app-icon name="doc-check" [size]="20" />
              </div>
              <div class="row-body">
                <span class="row-title">Barem de corectare</span>
                <span class="row-subtitle">Schema de notare</span>
              </div>
              @if (baremPdfPath()) {
                <app-icon name="chevron-right" [size]="14" />
              } @else {
                <span class="row-badge">Indisponibil</span>
              }
            </button>
          }
        </div>
      </section>

      <!-- ═══ NOTĂ ESTIMATĂ ═══ -->
      <section class="group">
        <div class="group-header">AUTOEVALUARE</div>
        <div class="card">
          <div class="grade-cell">
            <div class="grade-top">
              <span class="grade-label">Nota obținută</span>
              <span class="grade-value">{{ estimatedGrade().toFixed(1) }}</span>
            </div>
            <input
              class="ios-slider"
              type="range"
              min="1"
              max="10"
              step="0.5"
              [ngModel]="estimatedGrade()"
              (ngModelChange)="setGrade($event)"
              [style.--pct.%]="((estimatedGrade() - 1) / 9) * 100"
            />
            <div class="scale-row">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ NOTE PERSONALE ═══ -->
      <section class="group">
        <div class="group-header">NOTE PERSONALE</div>
        <div class="card">
          <div class="notes-cell">
            <textarea
              class="notes-area"
              rows="4"
              placeholder="Observații, formule, greșeli frecvente..."
              [(ngModel)]="notes"
              (focus)="editingNotes.set(true)"
            ></textarea>
            @if (editingNotes()) {
              <button class="ios-btn-text save-btn" (click)="editingNotes.set(false)">
                Salvează
              </button>
            }
          </div>
        </div>
      </section>

      <!-- ═══ FINALIZARE ═══ -->
      <section class="group">
        <div class="card">
          <button class="row-action" (click)="markSolved()">
            <app-icon name="check" [size]="18" />
            <span>Marchează ca rezolvat</span>
          </button>
        </div>
      </section>

      <div style="height: var(--tab-clearance)"></div>
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
      /* ── Page ── */
      :host { display: block; }

      .hero { padding: 8px 0 24px; }
      .meta {
        font-size: 13px;
        font-weight: 400;
        color: var(--label-2);
        letter-spacing: -0.1px;
        margin-bottom: 4px;
      }
      .large-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 34px;
        font-weight: 700;
        letter-spacing: -0.7px;
        line-height: 1.1;
        color: var(--label);
      }

      /* ── iOS Grouped Section ── */
      .group { margin-bottom: 32px; }
      .group-header {
        font-size: 13px;
        font-weight: 400;
        letter-spacing: -0.08px;
        color: var(--label-2);
        text-transform: uppercase;
        margin-bottom: 8px;
        padding-left: 4px;
      }
      .card {
        background: var(--surface);
        border-radius: 16px;
        overflow: hidden;
      }

      .separator { height: 0.33px; background: var(--separator); }
      .separator.inset { margin-left: 16px; }

      /* ── Timer (Fitness style) ── */
      .timer-cell { padding: 20px 16px 16px; }
      .timer-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .timer-digits {
        font-family: var(--font-display);
        font-size: 48px;
        font-weight: 700;
        letter-spacing: -2px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        color: var(--label);
      }
      .live-pill {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 100px;
        background: rgba(52, 199, 89, 0.15);
        color: var(--green);
        margin-top: 6px;
      }
      .thin-track {
        margin-top: 16px;
        height: 4px;
        border-radius: 100px;
        background: var(--fill);
        overflow: hidden;
      }
      .thin-fill {
        height: 100%;
        border-radius: 100px;
        background: var(--label-3);
        transition: width 1s linear;
      }
      .timer-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 13px;
        color: var(--label-3);
      }

      .action-cell { padding: 12px 16px 16px; }
      .btn-pair { display: flex; gap: 10px; }
      .flex-1 { flex: 1; }

      /* ── iOS Buttons ── */
      .ios-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        height: 50px;
        border: none;
        border-radius: 14px;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: -0.3px;
        cursor: pointer;
        transition: opacity 120ms ease-out;
        user-select: none;
      }
      .ios-btn:active { opacity: 0.72; }
      .ios-btn.filled {
        background: var(--blue);
        color: #fff;
      }
      .ios-btn.tinted-destructive {
        background: rgba(255, 59, 48, 0.12);
        color: var(--red);
      }

      .ios-btn-text {
        border: none;
        background: transparent;
        color: var(--blue);
        font-size: 17px;
        font-weight: 400;
        cursor: pointer;
        padding: 8px 0;
        transition: opacity 100ms ease-out;
      }
      .ios-btn-text:active { opacity: 0.5; }

      /* ── Rows (Settings style) ── */
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        padding: 12px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--label);
        font-family: inherit;
        font-size: inherit;
        transition: background 80ms ease-out;
      }
      .row:active { background: var(--fill); }
      .row.disabled {
        pointer-events: none;
        opacity: 0.5;
      }
      .row-icon {
        width: 32px; height: 32px;
        border-radius: 8px;
        background: var(--fill);
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
        color: var(--label-2);
      }
      .row-body { flex: 1; min-width: 0; }
      .row-title {
        display: block;
        font-size: 17px;
        font-weight: 400;
        letter-spacing: -0.25px;
        color: var(--label);
      }
      .row-subtitle {
        display: block;
        font-size: 13px;
        color: var(--label-3);
        margin-top: 1px;
      }
      .row-badge {
        font-size: 13px;
        color: var(--label-3);
      }
      .row app-icon:last-child { color: var(--label-3); }

      .row-action {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-size: 17px;
        font-weight: 400;
        color: var(--blue);
        transition: background 80ms ease-out;
      }
      .row-action:active { background: var(--fill); }

      .center-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .center-cell.muted { color: var(--label-3); font-size: 15px; }

      /* ── Grade (Health style) ── */
      .grade-cell { padding: 16px; }
      .grade-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .grade-label {
        font-size: 17px;
        font-weight: 400;
        color: var(--label);
      }
      .grade-value {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.5px;
        font-variant-numeric: tabular-nums;
        color: var(--label);
      }

      /* iOS slider — native proportions */
      .ios-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 28px;
        background: transparent;
        margin: 0;
      }
      .ios-slider::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 100px;
        background:
          linear-gradient(to right, var(--label-3) var(--pct, 50%), var(--fill) var(--pct, 50%));
      }
      .ios-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 28px;
        height: 28px;
        margin-top: -12px;
        border-radius: 50%;
        background: #fff;
        box-shadow:
          0 0.5px 1px rgba(0, 0, 0, 0.16),
          0 2px 6px rgba(0, 0, 0, 0.12);
      }
      .ios-slider::-moz-range-track {
        height: 4px;
        border-radius: 100px;
        background:
          linear-gradient(to right, var(--label-3) var(--pct, 50%), var(--fill) var(--pct, 50%));
      }
      .ios-slider::-moz-range-thumb {
        width: 28px; height: 28px; border: none; border-radius: 50%;
        background: #fff;
        box-shadow:
          0 0.5px 1px rgba(0, 0, 0, 0.16),
          0 2px 6px rgba(0, 0, 0, 0.12);
      }

      .scale-row {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 13px;
        color: var(--label-3);
      }

      /* ── Notes (Apple Notes feel) ── */
      .notes-cell { padding: 4px 16px 16px; }
      .notes-area {
        width: 100%;
        min-height: 100px;
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: 17px;
        line-height: 1.4;
        color: var(--label);
        resize: vertical;
        padding: 12px 0;
        outline: none;
      }
      .notes-area::placeholder { color: var(--label-3); }
      .save-btn {
        display: block;
        margin-left: auto;
      }
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
      assets === null ? 'Nu am găsit documente pentru această selecție.' : null,
    );
  }

  readonly subjectPdfPath = computed(() => this.pdfAssets()?.subjectPdfAsset?.trim() || null);
  readonly baremPdfPath = computed(() => this.pdfAssets()?.answerPdfAsset?.trim() || null);

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
    const pdfPath = this.subjectPdfPath();
    if (!pdfPath) {
      await this.dialogs.show(
        'Subiect indisponibil',
        'Nu am găsit acest subiect pentru selecția curentă. Încearcă alt an sau altă materie.',
        [{ label: 'OK', value: true }],
      );
      return;
    }
    this.settings.medium();
    this.examStarted.set(true);
    this.fullscreen.set({ src: pdfPath, examMode: true });
  }

  openSubjectPdf(): void {
    const path = this.subjectPdfPath();
    if (!path) return;
    this.fullscreen.set({ src: path, examMode: false });
  }

  openBaremPdf(): void {
    const path = this.baremPdfPath();
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
      'Oprești examenul?',
      'Progresul timerului va fi resetat.',
      'Oprește',
      'Anulează',
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
      'Subiectul a fost salvat în istoricul tău.',
      [{ label: 'OK', value: true }],
    );
    this.router.navigateByUrl('/home');
  }
}
