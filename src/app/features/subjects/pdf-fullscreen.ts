/**
 * Viewer PDF fullscreen — port al PdfFullscreenScreen din main_shell.dart.
 *
 * PDF-urile remote (e3.ro / profesorjitaruionel.com) nu trimit headere CORS,
 * deci nu pot fi randate cu pdf.js; iar viewerul nativ din iframe nu există
 * pe Android Chrome. Randăm prin viewerul Google Docs (embedded), care însă
 * răspunde uneori gol la prima cerere — de aceea: spinner cât se încarcă,
 * reîncercare automată la interval (max 4 încercări) și reîncercare manuală.
 * În modul examen, bara frosted cu timerul (tick de 1s) e suprapusă peste
 * document; la ieșire întoarce { secondsLeft, isFinished }.
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { AppSettingsService } from '../../core/services/app-settings.service';
import { AppButtonComponent, IconComponent } from '../../ui/ui';

export interface ExamFullscreenResult {
  secondsLeft: number;
  isFinished: boolean;
}

const RETRY_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 4;

@Component({
  selector: 'app-pdf-fullscreen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, IconComponent],
  template: `
    <div class="screen">
      <header class="topbar">
        <button class="tbtn" (click)="close()" aria-label="Înapoi">
          <app-icon name="chevron-back" [size]="22" />
        </button>
        <div class="ttitle">{{ title() }}</div>
        <a class="tbtn" [href]="src()" target="_blank" rel="noopener" title="Deschide în tab nou">
          <app-icon name="doc-on-doc" [size]="18" />
        </a>
      </header>

      <div class="viewer">
        @if (failed()) {
          <div class="error">
            <div class="err-icon"><app-icon name="wifi-off" [size]="30" /></div>
            <div class="err-title">Subiectul nu a putut fi încărcat</div>
            <div class="err-msg">
              Verifică conexiunea la internet și încearcă din nou. Documentul poate fi
              indisponibil momentan.
            </div>
            <div class="err-actions">
              <app-button
                label="Reîncearcă"
                icon="arrow-swap"
                [expanded]="false"
                class="inline-host"
                (pressed)="retryManual()"
              />
              <button class="err-back" (click)="close()">Înapoi</button>
            </div>
          </div>
        } @else {
          <iframe
            [src]="safeSrc()"
            title="Document PDF"
            (load)="onFrameLoad()"
          ></iframe>
          @if (loading()) {
            <div class="loading">
              <span class="spinner light"></span>
              <span class="ltext">Se încarcă subiectul...</span>
              @if (attempt() > 1) {
                <span class="lretry">Reîncercare {{ attempt() }}/{{ maxAttempts }}</span>
              }
            </div>
          }
        }

        @if (examMode()) {
          <div class="timerbar">
            <div class="trow">
              <span class="ttime" [style.color]="timerColor()">{{ formattedTime() }}</span>
              <span class="tmin">{{ minutesLeft() }} min</span>
            </div>
            <div class="ttrack">
              <div
                class="tfill"
                [style.width.%]="timerProgress() * 100"
                [style.background]="timerColor()"
              ></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .screen {
        position: fixed;
        inset: 0;
        z-index: 80;
        background: #000;
        display: flex;
        flex-direction: column;
      }
      .topbar {
        display: flex;
        align-items: center;
        gap: var(--x2);
        height: calc(52px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) var(--x2) 0;
        background: #000;
        color: #fff;
      }
      .tbtn {
        width: 44px; height: 44px;
        border: none;
        background: transparent;
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        flex: none;
      }
      .ttitle {
        flex: 1;
        text-align: center;
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .viewer { position: relative; flex: 1; }
      iframe { width: 100%; height: 100%; border: none; background: #2a2a2e; }
      .loading {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--x3);
        background: #1c1c1f;
        color: rgba(255, 255, 255, 0.75);
      }
      .ltext { font-size: 14px; }
      .lretry { font-size: 12px; color: rgba(255, 255, 255, 0.45); }
      .timerbar {
        position: absolute;
        left: var(--x4); right: var(--x4); top: var(--x3);
        padding: var(--x3) var(--x4);
        border-radius: var(--r-md);
        background: rgba(0, 0, 0, 0.55);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .trow { display: flex; align-items: center; }
      .ttime { font-weight: 700; font-size: 15px; font-variant-numeric: tabular-nums; }
      .tmin { margin-left: auto; color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 600; }
      .ttrack {
        margin-top: var(--x2);
        height: 4px;
        border-radius: var(--r-pill);
        background: rgba(255, 255, 255, 0.24);
        overflow: hidden;
      }
      .tfill { height: 100%; border-radius: var(--r-pill); transition: width 1s linear; }
      .error {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--x6);
        text-align: center;
        color: #fff;
      }
      .err-icon {
        width: 64px; height: 64px;
        border-radius: var(--r-lg);
        background: rgba(255, 255, 255, 0.08);
        display: flex; align-items: center; justify-content: center;
      }
      .err-title { margin-top: var(--x4); font-family: var(--font-display); font-size: 18px; font-weight: 600; }
      .err-msg { margin-top: var(--x2); color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.4; max-width: 320px; }
      .err-actions { margin-top: var(--x6); display: flex; align-items: center; gap: var(--x3); }
      .err-back {
        border: none;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        font-weight: 600;
        font-size: 16px;
        padding: 14px var(--x6);
        border-radius: var(--r-md);
        cursor: pointer;
      }
    `,
  ],
})
export class PdfFullscreenComponent implements OnInit, OnDestroy {
  readonly src = input.required<string>();
  readonly title = input.required<string>();
  readonly examMode = input(false);
  readonly initialSecondsLeft = input(10800);
  readonly totalDurationSeconds = input(10800);
  @Output() closed = new EventEmitter<ExamFullscreenResult>();

  private settings = inject(AppSettingsService);
  private sanitizer = inject(DomSanitizer);

  readonly maxAttempts = MAX_ATTEMPTS;
  readonly secondsLeft = signal(10800);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly attempt = signal(1);
  readonly safeSrc = signal<SafeResourceUrl>('');

  private timer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private isRemote = false;

  ngOnInit(): void {
    this.secondsLeft.set(this.initialSecondsLeft());
    const raw = this.src().trim();
    this.isRemote = raw.startsWith('http://') || raw.startsWith('https://');
    this.loadFrame();

    if (this.examMode()) {
      this.timer = setInterval(() => {
        if (this.secondsLeft() > 0) {
          this.secondsLeft.set(this.secondsLeft() - 1);
        } else {
          if (this.timer) clearInterval(this.timer);
          this.settings.heavy();
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.clearRetry();
  }

  /** Setează sursa iframe-ului și armează reîncercarea automată. */
  private loadFrame(): void {
    const raw = this.src().trim();
    // parametru de cache-bust ca fiecare încercare să fie o cerere nouă
    const bust = this.attempt() > 1 ? `&retry=${this.attempt()}` : '';
    const viewerUrl = this.isRemote
      ? 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(raw) + bust
      : raw;
    this.loading.set(true);
    this.safeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl));

    this.clearRetry();
    if (this.isRemote) {
      this.retryTimer = setTimeout(() => this.onLoadTimeout(), RETRY_INTERVAL_MS);
    }
  }

  private onLoadTimeout(): void {
    if (!this.loading()) return;
    if (this.attempt() >= MAX_ATTEMPTS) {
      this.loading.set(false);
      this.failed.set(true);
      return;
    }
    this.attempt.set(this.attempt() + 1);
    this.loadFrame();
  }

  onFrameLoad(): void {
    this.loading.set(false);
    this.clearRetry();
  }

  retryManual(): void {
    this.failed.set(false);
    this.attempt.set(1);
    this.loadFrame();
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  readonly formattedTime = computed(() => {
    const s = this.secondsLeft();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(Math.trunc(s / 3600))}:${p(Math.trunc((s % 3600) / 60))}:${p(s % 60)}`;
  });
  readonly minutesLeft = computed(() => Math.ceil(this.secondsLeft() / 60));
  readonly timerProgress = computed(() =>
    Math.min(Math.max(
      (this.totalDurationSeconds() - this.secondsLeft()) / this.totalDurationSeconds(), 0), 1),
  );
  readonly timerColor = computed(() => {
    const s = this.secondsLeft();
    if (s > 3600) return 'var(--green)';
    if (s > 900) return 'var(--orange)';
    return 'var(--red)';
  });

  close(): void {
    this.closed.emit({
      secondsLeft: this.secondsLeft(),
      isFinished: this.secondsLeft() === 0,
    });
  }
}
