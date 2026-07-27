/**
 * Layout-ul de autentificare pe două coloane, folosit de toate ecranele de auth.
 *
 * Pe mobil (< 1024px) nu schimbă nimic: proiectează conținutul exact ca înainte.
 * Pe desktop adaugă în stânga un panou de brand (aurora + grid + grain, listă de
 * beneficii, countdown-ul real către BAC) și centrează formularul în dreapta.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CountdownService } from '../../core/services/countdown.service';
import { IconComponent } from '../../ui/ui';

const DATE_FMT = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'app-auth-split',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="split">
      <aside class="brand" aria-hidden="false">
        <span class="glow g1"></span>
        <span class="glow g2"></span>
        <span class="grid"></span>
        <span class="grain"></span>

        <header class="mark">
          <span class="badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                 stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4 2 9l10 5 10-5-10-5Z" />
              <path d="M6 11.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.8" />
              <path d="M22 9v5.5" />
            </svg>
          </span>
          <span class="wordmark">BacPro</span>
        </header>

        <div class="pitch">
          <h2 class="headline">
            Tot ce ai nevoie pentru <em>Bacalaureat</em>, într-un singur loc.
          </h2>
          <p class="lede">
            Subiecte și bareme oficiale, timer de examen și progresul tău — aceleași
            date pe telefon și pe desktop.
          </p>

          <ul class="features">
            <li>
              <span class="chip"><app-icon name="doc-check" [size]="17" /></span>
              <div>
                <b>Subiecte oficiale</b>
                <span>Variante și bareme din 2020 până în 2026</span>
              </div>
            </li>
            <li>
              <span class="chip"><app-icon name="timer" [size]="17" /></span>
              <div>
                <b>Mod examen</b>
                <span>Timer de 3 ore, exact ca la proba reală</span>
              </div>
            </li>
            <li>
              <span class="chip"><app-icon name="chart-bar" [size]="17" /></span>
              <div>
                <b>Progresul tău</b>
                <span>Streak, medie și obiective săptămânale</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="countdown">
          @if (days() > 0) {
            <div class="days"><b>{{ days() }}</b><span>zile</span></div>
            <div class="cd-text">
              <b>până la Bacalaureat</b>
              <span>{{ examDate() }}</span>
            </div>
          } @else {
            <div class="cd-text solo">
              <b>Azi e ziua examenului</b>
              <span>Baftă! Ai muncit pentru asta.</span>
            </div>
          }
        </div>
      </aside>

      <section class="pane"><ng-content /></section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: var(--bg);
      }
      .split {
        display: block;
      }
      .brand {
        display: none;
      }

      /* ------------------------------------------------------------ desktop -- */
      @media (min-width: 1024px) {
        .split {
          display: grid;
          grid-template-columns: minmax(0, 1.04fr) minmax(0, 1fr);
          min-height: 100dvh;
          background: var(--bg);
        }
        .brand {
          display: flex;
        }
        .pane {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background:
            radial-gradient(90% 70% at 50% 0%, rgba(0, 122, 255, 0.05) 0%, transparent 62%),
            var(--bg);
        }
      }

      /* -------------------------------------------------------------- brand -- */
      .brand {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        flex-direction: column;
        justify-content: space-between;
        gap: 44px;
        padding: 56px 56px 52px;
        color: #fff;
        background:
          radial-gradient(115% 85% at 4% -4%, #1d3f78 0%, rgba(29, 63, 120, 0) 56%),
          radial-gradient(95% 80% at 98% 104%, #114a61 0%, rgba(17, 74, 97, 0) 60%),
          linear-gradient(158deg, #0a1122 0%, #05080f 100%);
      }

      .glow {
        position: absolute;
        z-index: -1;
        border-radius: 50%;
        filter: blur(90px);
        pointer-events: none;
      }
      .g1 {
        width: 540px;
        height: 540px;
        top: -170px;
        left: -130px;
        background: rgba(0, 122, 255, 0.33);
        animation: drift-a 24s ease-in-out infinite;
      }
      .g2 {
        width: 470px;
        height: 470px;
        right: -150px;
        bottom: -150px;
        background: rgba(50, 173, 230, 0.26);
        animation: drift-b 30s ease-in-out infinite;
      }
      @keyframes drift-a {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(70px, 50px, 0) scale(1.1);
        }
      }
      @keyframes drift-b {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(-60px, -40px, 0) scale(1.08);
        }
      }

      .grid {
        position: absolute;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 58px 58px;
        -webkit-mask-image: radial-gradient(78% 68% at 26% 22%, #000 0%, transparent 76%);
        mask-image: radial-gradient(78% 68% at 26% 22%, #000 0%, transparent 76%);
      }

      .grain {
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: 0.055;
        mix-blend-mode: overlay;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      /* --------------------------------------------------------------- mark -- */
      .mark {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .badge {
        width: 46px;
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        color: #fff;
        background: rgba(255, 255, 255, 0.09);
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
        -webkit-backdrop-filter: blur(18px);
        backdrop-filter: blur(18px);
      }
      .wordmark {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      /* -------------------------------------------------------------- pitch -- */
      .headline {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(34px, 3.3vw, 50px);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: -1.5px;
        max-width: 15ch;
      }
      .headline em {
        font-style: normal;
        background: linear-gradient(100deg, #79bcff 0%, #63e0ff 58%, #a9dcff 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .lede {
        margin: 20px 0 0;
        max-width: 46ch;
        font-size: 17px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.62);
      }

      .features {
        list-style: none;
        margin: 40px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .features li {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }
      .chip {
        flex: none;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        color: #8ecbff;
        background: rgba(120, 190, 255, 0.12);
        border: 1px solid rgba(140, 200, 255, 0.18);
      }
      .features div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 3px;
      }
      .features b {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.2px;
      }
      .features div span {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
      }

      /* ---------------------------------------------------------- countdown -- */
      .countdown {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 18px;
        padding: 16px 24px 16px 22px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.055);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        -webkit-backdrop-filter: blur(22px);
        backdrop-filter: blur(22px);
      }
      .days {
        display: flex;
        align-items: baseline;
        gap: 5px;
        padding-right: 18px;
        border-right: 1px solid rgba(255, 255, 255, 0.12);
      }
      .days b {
        font-family: var(--font-display);
        font-size: 38px;
        font-weight: 700;
        letter-spacing: -1.6px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .days span {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
      }
      .cd-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .cd-text b {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.2px;
      }
      .cd-text span {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
      }
      .cd-text.solo b {
        font-size: 17px;
      }

      @media (min-width: 1440px) {
        .brand {
          padding: 72px 76px 64px;
        }
        .pane {
          padding: 56px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .glow {
          animation: none;
        }
      }
    `,
  ],
})
export class AuthSplitComponent {
  private countdown = inject(CountdownService);

  readonly days = computed(() => this.countdown.model().daysRemaining);
  readonly examDate = computed(() => DATE_FMT.format(this.countdown.model().examDate));
}
