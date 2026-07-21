/**
 * Viewer PDF fullscreen — randare cu PDF.js (canvas per pagină).
 *
 * Problema: iframe-urile PDF nu permit scroll pe iOS Safari (doar prima
 * pagină e vizibilă). Soluția: PDF.js randează fiecare pagină într-un
 * `<canvas>` plasat într-un container scrollabil nativ — funcționează
 * pe toate platformele (iOS Safari, Android Chrome, desktop).
 *
 * Pinch-to-zoom: containerul are `touch-action: pan-x pan-y pinch-zoom`
 * și permite zoom nativ prin dublu-tap sau pinch.
 *
 * În modul examen, bara frosted cu timerul (tick de 1s) e suprapusă peste
 * document; la ieșire întoarce { secondsLeft, isFinished }.
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import * as pdfjsLib from 'pdfjs-dist';

import { AppSettingsService } from '../../core/services/app-settings.service';
import { IconComponent } from '../../ui/ui';

// Worker-ul a fost copiat în /public la build → disponibil la root.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

export interface ExamFullscreenResult {
  secondsLeft: number;
  isFinished: boolean;
}

@Component({
  selector: 'app-pdf-fullscreen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
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

      <div class="viewer" #viewerContainer>
        @if (failed()) {
          <div class="error">
            <div class="err-icon"><app-icon name="wifi-off" [size]="30" /></div>
            <div class="err-title">Subiectul nu a putut fi încărcat</div>
            <div class="err-msg">
              Verifică conexiunea la internet și încearcă din nou. Documentul poate fi
              indisponibil momentan.
            </div>
            <div class="err-actions">
              <a class="err-open" [href]="src()" target="_blank" rel="noopener">Deschide în tab nou</a>
              <button class="err-back" (click)="close()">Înapoi</button>
            </div>
          </div>
        } @else {
          <div class="pages" #pagesContainer>
            <!-- Paginile canvas se inserează dinamic din cod -->
          </div>
          @if (loading()) {
            <div class="loading">
              <span class="spinner light"></span>
              <span class="ltext">Se încarcă subiectul...</span>
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
        flex: none;
      }
      .tbtn {
        width: 44px; height: 44px;
        border: none;
        background: transparent;
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        flex: none;
        text-decoration: none;
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
      .viewer {
        position: relative;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
      .pages {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x pan-y pinch-zoom;
        background: #525659;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
      }
      .pages canvas {
        display: block;
        max-width: 100%;
        height: auto;
        /* Umbre subtile pe fiecare pagină pentru separare vizuală */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      }
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
        pointer-events: none;
      }
      .ltext { font-size: 14px; }
      .timerbar {
        position: absolute;
        left: var(--x4); right: var(--x4); bottom: calc(var(--x4) + env(safe-area-inset-bottom, 0px));
        padding: var(--x3) var(--x4);
        border-radius: var(--r-md);
        background: rgba(0, 0, 0, 0.62);
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
      .err-open {
        border: none;
        background: var(--blue);
        color: #fff;
        font-weight: 600;
        font-size: 15px;
        padding: 14px var(--x5);
        border-radius: var(--r-md);
        text-decoration: none;
      }
      .err-back {
        border: none;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        font-weight: 600;
        font-size: 15px;
        padding: 14px var(--x5);
        border-radius: var(--r-md);
        cursor: pointer;
      }
    `,
  ],
})
export class PdfFullscreenComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly src = input.required<string>();
  readonly title = input.required<string>();
  readonly examMode = input(false);
  readonly initialSecondsLeft = input(10800);
  readonly totalDurationSeconds = input(10800);
  @Output() closed = new EventEmitter<ExamFullscreenResult>();

  private settings = inject(AppSettingsService);

  readonly pagesContainer = viewChild<ElementRef<HTMLDivElement>>('pagesContainer');

  readonly secondsLeft = signal(10800);
  readonly loading = signal(true);
  readonly failed = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private loadWatchdog: ReturnType<typeof setTimeout> | null = null;
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  private renderAborted = false;

  ngOnInit(): void {
    this.secondsLeft.set(this.initialSecondsLeft());

    // Watchdog: dacă PDF.js nu reușește în 15s, arătăm fallback-ul
    this.loadWatchdog = setTimeout(() => {
      if (this.loading()) {
        this.loading.set(false);
        this.failed.set(true);
      }
    }, 15000);

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

  ngAfterViewInit(): void {
    this.loadAndRenderPdf();
  }

  ngOnDestroy(): void {
    this.renderAborted = true;
    if (this.timer) clearInterval(this.timer);
    if (this.loadWatchdog) clearTimeout(this.loadWatchdog);
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
  }

  private async loadAndRenderPdf(): Promise<void> {
    const url = this.src().trim();
    if (!url) {
      this.loading.set(false);
      this.failed.set(true);
      return;
    }

    try {
      const task = pdfjsLib.getDocument({
        url,
        // Fetch cu CORS — majoritatea PDF-urilor bac sunt servite cu CORS permisiv
        withCredentials: false,
      });
      this.pdfDoc = await task.promise;
    } catch {
      this.loading.set(false);
      this.failed.set(true);
      return;
    }

    if (this.loadWatchdog) {
      clearTimeout(this.loadWatchdog);
      this.loadWatchdog = null;
    }

    if (this.renderAborted || !this.pdfDoc) return;

    const container = this.pagesContainer()?.nativeElement;
    if (!container) {
      this.loading.set(false);
      this.failed.set(true);
      return;
    }

    const numPages = this.pdfDoc.numPages;
    const devicePixelRatio = window.devicePixelRatio || 1;
    // Lățimea containerului — canvas-urile se potrivesc pe lățime
    const containerWidth = container.clientWidth;

    for (let i = 1; i <= numPages; i++) {
      if (this.renderAborted) return;

      try {
        const page = await this.pdfDoc.getPage(i);
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Scalăm PDF-ul ca să se potrivească pe lățimea containerului
        const cssScale = containerWidth / unscaledViewport.width;
        const renderScale = cssScale * devicePixelRatio;
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // Dimensiuni CSS — fit pe lățime
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${(containerWidth / unscaledViewport.width) * unscaledViewport.height}px`;

        container.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Ascundem spinner-ul după prima pagină
        if (i === 1) {
          this.loading.set(false);
        }
      } catch {
        // Dacă o pagină individuală eșuează, continuăm cu următoarele
        if (i === 1) {
          this.loading.set(false);
          this.failed.set(true);
          return;
        }
      }
    }

    // Asigurăm că loading e false dacă nu a fost deja
    this.loading.set(false);
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
