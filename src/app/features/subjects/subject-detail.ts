/**
 * Ecranul de subiect — redesign modern în stil Apple (iOS / macOS):
 * Header curat cu pill-uri, card dedicat pentru documentele oficiale (Subiect & Barem)
 * cu acțiuni directe de previzualizare fără să comuți tab-uri, timer de examen (3h)
 * cu bară fină de progres, autoevaluare cu slider liquid-glass și note personale.
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
  IconComponent,
  PillBadgeComponent,
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
    IconComponent,
    PillBadgeComponent,
    PdfFullscreenComponent,
  ],
  template: `
    <app-glass-header title="" [large]="false" />
    <div class="page-scroll">
      <!-- Header Titlu stil Apple -->
      <div class="page-pad title-block">
        <div class="pill-tags">
          <app-pill-badge [label]="'Anul ' + year()" />
          <app-pill-badge [label]="sessionName()" />
        </div>
        <h1 class="stitle">{{ subjectName() }}</h1>
      </div>

      <!-- Documente Oficiale: Carduri de acțiune directă Apple -->
      <div class="page-pad">
        <div class="t-section section-header">Documente oficiale</div>
        <div class="floating-card docs-card">
          @if (pdfLoading()) {
            <div class="docs-loading">
              <span class="spinner"></span>
              <span>Se caută documentele...</span>
            </div>
          } @else if (pdfError()) {
            <div class="docs-empty">
              <app-icon name="info-circle" [size]="20" />
              <span>{{ pdfError() }}</span>
            </div>
          } @else {
            <div class="doc-rows">
              <!-- Subiect -->
              <div class="doc-item">
                <div class="doc-icon-box">
                  <app-icon name="doc-text" [size]="22" />
                </div>
                <div class="doc-info">
                  <div class="doc-name">Subiect Examen</div>
                  <div class="doc-meta">Varianta oficială PDF</div>
                </div>
                <div class="doc-actions">
                  @if (subjectPdfPath()) {
                    <button class="apple-pill-btn pressable" (click)="openSubjectPdf()">
                      <app-icon name="eye" [size]="15" />
                      <span>Vezi PDF</span>
                    </button>
                  }
                </div>
              </div>

              <div class="doc-divider"></div>

              <!-- Barem -->
              <div class="doc-item">
                <div class="doc-icon-box">
                  <app-icon name="doc-check" [size]="22" />
                </div>
                <div class="doc-info">
                  <div class="doc-name">Barem de corectare</div>
                  <div class="doc-meta">Schema de notare PDF</div>
                </div>
                <div class="doc-actions">
                  @if (baremPdfPath()) {
                    <button class="apple-pill-btn pressable" (click)="openBaremPdf()">
                      <app-icon name="eye" [size]="15" />
                      <span>Vezi Barem</span>
                    </button>
                  } @else {
                    <span class="no-doc">Indisponibil</span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Timer Examen 3 Ore -->
      <div class="page-pad" style="margin-top: var(--x5)">
        <div class="t-section section-header">Mod Examen (3 Ore)</div>
        <div class="floating-card timer-card">
          <div class="timer-top">
            <div>
              <div class="t-caption">Timp examen</div>
              <div class="big-time">{{ formattedTime() }}</div>
            </div>
            @if (examStarted()) {
              <span class="status-chip">În desfășurare</span>
            }
          </div>

          <div class="thinbar">
            <div class="thinbar-fill" [style.width.%]="timerProgress() * 100"></div>
          </div>
          <div class="tmeta">
            <span>{{ consumedLabel() }}% parcurs</span>
            <span>{{ minutesLeft() }} min rămase</span>
          </div>

          <div class="tactions">
            @if (!examStarted()) {
              <app-button
                label="Start Examen (3h)"
                icon="play-fill"
                [height]="50"
                (pressed)="startTimer()"
              />
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

      <!-- Autoevaluare -->
      <div class="page-pad" style="margin-top: var(--x5)">
        <div class="t-section section-header">Nota estimată</div>
        <div class="glass-panel grade-glass">
          <div class="grade-row">
            <span class="t-body">Nota obținută</span>
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
            <span class="t-caption">1.0</span>
            <span class="t-caption">5.0</span>
            <span class="t-caption">10.0</span>
          </div>
        </div>
      </div>

      <!-- Note personale -->
      <app-card-group header="Note personale">
        <div class="notes-cell">
          <div class="app-input multiline">
            <textarea
              rows="4"
              placeholder="Scrie observații, formule importante, greșeli făcute..."
              [(ngModel)]="notes"
              (focus)="editingNotes.set(true)"
            ></textarea>
          </div>
          @if (editingNotes()) {
            <div class="notes-save">
              <app-button
                label="Salvează notele"
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
        <app-button label="Marchează ca rezolvat" icon="check" [height]="54" (pressed)="markSolved()" />
      </div>
      <div style="height: var(--x6)"></div>
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
      /* Header titlu Apple */
      .title-block { padding-top: var(--x2); padding-bottom: var(--x4); }
      .pill-tags { display: flex; gap: var(--x2); margin-bottom: var(--x2); }
      .stitle {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(28px, 8vw, 36px);
        font-weight: 800;
        letter-spacing: -0.8px;
        line-height: 1.1;
        color: var(--label);
      }

      /* Card Documente Oficiale Apple */
      .docs-card { padding: 0; overflow: hidden; }
      .docs-loading {
        display: flex; align-items: center; justify-content: center; gap: var(--x3);
        padding: var(--x6); color: var(--label-2); font-size: 14px;
      }
      .docs-empty {
        display: flex; align-items: center; justify-content: center; gap: var(--x2);
        padding: var(--x6); color: var(--label-2); font-size: 14px; text-align: center;
      }
      .doc-rows { display: flex; flex-direction: column; }
      .doc-item {
        display: flex; align-items: center; gap: var(--x3);
        padding: var(--x4);
      }
      .doc-icon-box {
        width: 42px; height: 42px; border-radius: 12px;
        background: var(--fill); color: var(--label);
        display: flex; align-items: center; justify-content: center;
        flex: none;
      }
      .doc-info { flex: 1; min-width: 0; }
      .doc-name { font-weight: 600; font-size: 15px; letter-spacing: -0.2px; color: var(--label); }
      .doc-meta { font-size: 12.5px; color: var(--label-2); margin-top: 2px; }
      .doc-actions { display: flex; align-items: center; gap: var(--x2); flex: none; }
      .doc-divider { height: 0.5px; background: var(--separator); margin: 0 var(--x4); }
      .no-doc { font-size: 12.5px; color: var(--label-3); font-weight: 500; }

      .apple-pill-btn {
        display: inline-flex; align-items: center; gap: 6px;
        border: none; padding: 8px 14px; border-radius: var(--r-pill);
        font-size: 13px; font-weight: 600; cursor: pointer;
        background: var(--fill); color: var(--blue);
        transition: background 160ms var(--ease), opacity 140ms ease-out;
      }
      .apple-pill-btn:hover { background: var(--fill-secondary); }

      /* Timer Examen */
      .timer-card { text-align: left; }
      .timer-top { display: flex; align-items: flex-start; justify-content: space-between; }
      .status-chip {
        font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
        padding: 4px 10px; border-radius: var(--r-pill); background: rgba(52, 199, 89, 0.14); color: var(--green);
      }
      .big-time {
        margin-top: 2px;
        font-family: var(--font-display);
        font-size: 38px;
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

      /* Autoevaluare Liquid Glass */
      .grade-glass {
        padding: var(--x5);
        background-image: linear-gradient(150deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 60%);
        border-color: var(--glass-stroke);
      }
      :host-context(.dark) .grade-glass {
        background-image: linear-gradient(150deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 60%);
      }
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
        padding: 4px 14px;
        border-radius: var(--r-md);
        border: 0.5px solid var(--glass-stroke);
      }
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
      assets === null ? 'Nu am găsit documente asociate pentru această selecție.' : null,
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
        [{ label: 'Închide', value: true }],
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
