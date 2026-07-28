/**
 * Layout-ul de autentificare pe două coloane, folosit de toate ecranele de auth.
 *
 * Pe mobil (< 1024px) nu schimbă nimic: proiectează conținutul exact ca înainte.
 * Pe desktop pune pagina pe un mesh gri-argintiu, cu wordmark + headline mare în
 * stânga și formularul într-un card de sticlă în dreapta.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CountdownService } from '../../core/services/countdown.service';

const DATE_FMT = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'app-auth-split',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="split">
      <span class="grain"></span>

      <aside class="brand">
        <span class="wordmark">BacPro<i>.</i></span>

        <div class="pitch">
          <h2 class="headline">Toate subiectele de Bac, într-un singur loc.</h2>
          <p class="lede">
            Subiecte și bareme oficiale, timer de examen și progresul tău —
            aceleași date pe telefon și pe desktop.
          </p>
        </div>

        <p class="countdown">
          @if (days() > 0) {
            <b>{{ days() }} zile</b> până la Bacalaureat · {{ examDate() }}
          } @else {
            <b>Azi e ziua examenului.</b> Baftă!
          }
        </p>
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
      .brand,
      .grain {
        display: none;
      }

      /* ------------------------------------------------------------ desktop -- */
      @media (min-width: 1024px) {
        :host {
          /* mesh gri-argintiu, neutru — fără accente colorate */
          background:
            radial-gradient(62% 58% at 0% 4%, rgba(103, 122, 152, 0.5) 0%, rgba(103, 122, 152, 0) 66%),
            radial-gradient(54% 52% at 100% -4%, rgba(138, 154, 180, 0.55) 0%, rgba(138, 154, 180, 0) 68%),
            radial-gradient(58% 56% at 98% 100%, rgba(94, 111, 140, 0.45) 0%, rgba(94, 111, 140, 0) 66%),
            radial-gradient(52% 50% at 16% 108%, rgba(148, 163, 186, 0.5) 0%, rgba(148, 163, 186, 0) 68%),
            linear-gradient(150deg, #fafbfc 0%, #e9ecf1 46%, #d9dee7 100%);
          background-attachment: fixed;
        }
        .split {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.14fr) minmax(0, 1fr);
          align-items: center;
          gap: 40px;
          min-height: 100dvh;
          padding: 44px 56px;
        }
        .brand {
          display: flex;
        }
        .grain {
          display: block;
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.035;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .pane {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      /* -------------------------------------------------------------- brand -- */
      .brand {
        position: relative;
        z-index: 1;
        flex-direction: column;
        gap: 0;
        min-height: min(660px, 78dvh);
        padding-right: 24px;
      }

      .wordmark {
        font-family: var(--font-display);
        font-size: 23px;
        font-weight: 700;
        letter-spacing: -0.7px;
        color: var(--label);
      }
      .wordmark i {
        font-style: normal;
        color: var(--label-2);
      }

      .pitch {
        margin: auto 0;
        padding: 40px 0;
      }
      .headline {
        margin: 0;
        max-width: 13ch;
        font-family: var(--font-display);
        font-size: clamp(42px, 4.7vw, 74px);
        font-weight: 800;
        line-height: 1.02;
        letter-spacing: -2.6px;
        color: var(--label);
      }
      .lede {
        margin: 28px 0 0;
        max-width: 42ch;
        font-size: 18px;
        line-height: 1.5;
        color: var(--label-2);
      }

      .countdown {
        margin: 0;
        font-size: 14px;
        letter-spacing: -0.1px;
        color: var(--label-3);
      }
      .countdown b {
        font-weight: 600;
        color: var(--label-2);
        font-variant-numeric: tabular-nums;
      }

      @media (min-width: 1440px) {
        .split {
          padding: 56px 76px;
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
