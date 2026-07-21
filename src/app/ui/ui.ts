/**
 * BacPro Design System · componente partajate.
 * Port al lib/src/design/ui.dart + lib/src/widgets/common.dart.
 */
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  EventEmitter,
  HostListener,
  Injectable,
  Input,
  OnDestroy,
  Output,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';

import { AppSettingsService } from '../core/services/app-settings.service';
import { ICONS } from './icons';

/* ------------------------------------------------------------------ Icon -- */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      [attr.fill]="def().fill ? 'currentColor' : 'none'"
      [attr.stroke]="def().fill ? 'none' : 'currentColor'"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path [attr.d]="def().d" />
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; flex: none; }'],
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
  readonly def = computed(() => ICONS[this.name()] ?? ICONS['circle']);
}

/* ------------------------------------------------------------- Pressable -- */
@Directive({
  selector: '[appPressable]',
  host: { class: 'pressable' },
})
export class PressableDirective {
  private settings = inject(AppSettingsService);

  @HostListener('pointerdown')
  onDown(): void {
    this.settings.selection();
  }
}

/* ------------------------------------------------------------ TintedIcon -- */
@Component({
  selector: 'app-tinted-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="badge"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.borderRadius.px]="size() * 0.32"
      [style.background]="tint(color())"
      [style.color]="color()"
    >
      <app-icon [name]="icon()" [size]="size() * 0.5" />
    </div>
  `,
  styles: ['.badge { display: flex; align-items: center; justify-content: center; flex: none; }'],
})
export class TintedIconComponent {
  readonly icon = input.required<string>();
  readonly color = input('#007AFF');
  readonly size = input(40);
  tint = tint;
}

export function tint(color: string): string {
  return hexToRgba(color, 0.13);
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function accentGradient(color: string): string {
  return `linear-gradient(135deg, ${color}, ${lerpToBlue(color, 0.45)})`;
}

/** Echivalentul Color.lerp(color, #007AFF, t) din AppGradients.accent. */
export function lerpToBlue(hex: string, t: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const tr = Math.round(r + (0x00 - r) * t);
  const tg = Math.round(g + (0x7a - g) * t);
  const tb = Math.round(b + (0xff - b) * t);
  const p = (n: number) => n.toString(16).padStart(2, '0');
  return `#${p(tr)}${p(tg)}${p(tb)}`;
}

/* ------------------------------------------------------------- AppButton -- */
export type AppButtonStyle = 'primary' | 'secondary' | 'glass' | 'destructive' | 'subtle';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      class="btn pressable"
      [class.expanded]="expanded()"
      [class.glassy]="btnStyle() === 'glass'"
      [style.height.px]="height()"
      [style.background]="bg()"
      [style.color]="fg()"
      [style.border]="border()"
      [style.boxShadow]="shadow()"
      [style.opacity]="enabled() || loading() ? 1 : 0.45"
      [disabled]="!enabled()"
      (click)="onClick()"
    >
      @if (loading()) {
        <span class="spinner" [class.light]="btnStyle() === 'primary'"></span>
      } @else {
        @if (icon()) {
          <app-icon [name]="icon()!" [size]="19" />
        }
        <span class="label">{{ label() }}</span>
      }
    </button>
  `,
  styles: [
    `
      :host { display: block; }
      :host(:not(.inline-host)) { width: 100%; }
      .btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--x2);
        border: none;
        border-radius: var(--r-md);
        padding: 0 var(--x5);
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.3px;
        white-space: nowrap;
        overflow: hidden;
        transition: filter var(--dur-fast) ease-out;
      }
      /* highlight interior — dă butoanelor primary luciul Cupertino */
      .btn.lit::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 52%);
        pointer-events: none;
      }
      @media (hover: hover) {
        .btn:not(:disabled):hover { filter: brightness(1.04); }
      }
      .btn.expanded { width: 100%; }
      .btn.glassy { -webkit-backdrop-filter: blur(26px) saturate(1.5); backdrop-filter: blur(26px) saturate(1.5); }
      .btn:disabled { cursor: default; }
      .label { overflow: hidden; text-overflow: ellipsis; }
    `,
  ],
})
export class AppButtonComponent {
  readonly label = input.required<string>();
  readonly btnStyle = input<AppButtonStyle>('primary');
  readonly loading = input(false);
  readonly expanded = input(true);
  readonly icon = input<string | null>(null);
  readonly height = input(54);
  readonly accent = input('#007AFF');
  readonly disabled = input(false);
  @Output() pressed = new EventEmitter<void>();

  private settings = inject(AppSettingsService);

  readonly enabled = computed(() => !this.disabled() && !this.loading());

  bg = computed(() => {
    switch (this.btnStyle()) {
      // umplere solidă, ca butoanele filled din iOS — fără gradient
      case 'primary': return this.accent();
      case 'secondary': return tint(this.accent());
      case 'glass': return 'var(--glass)';
      case 'destructive': return tint('#FF3B30');
      case 'subtle': return 'var(--fill)';
    }
  });
  fg = computed(() => {
    switch (this.btnStyle()) {
      case 'primary': return '#fff';
      case 'secondary': return this.accent();
      case 'glass': return 'var(--label)';
      case 'destructive': return '#FF3B30';
      case 'subtle': return 'var(--label-2)';
    }
  });
  border = computed(() => (this.btnStyle() === 'glass' ? '1px solid var(--glass-stroke)' : 'none'));
  shadow = computed(() => {
    // butoane plate, ca în iOS — fără glow, fără umbre de accent
    if (this.enabled() && this.btnStyle() === 'glass') return 'var(--shadow-soft)';
    return 'none';
  });

  onClick(): void {
    if (!this.enabled()) return;
    this.settings.selection();
    this.pressed.emit();
  }
}

/* ----------------------------------------------------------------- Count -- */
/** Număr animat „care crește" către valoarea țintă (ease-out ~600ms). */
@Component({
  selector: 'app-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ display() }}`,
  styles: [':host { font-variant-numeric: tabular-nums; }'],
})
export class CountComponent implements OnDestroy {
  readonly value = input.required<number>();
  readonly decimals = input(0);
  readonly display = signal('0');
  private raf = 0;
  private current = 0;

  constructor() {
    effect(() => this.tween(this.value()));
  }

  private tween(target: number): void {
    cancelAnimationFrame(this.raf);
    if (typeof performance === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      this.current = target;
      this.display.set(target.toFixed(this.decimals()));
      return;
    }
    const start = this.current;
    const t0 = performance.now();
    const dur = 600;
    const d = this.decimals();
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      this.current = start + (target - start) * eased;
      this.display.set(this.current.toFixed(d));
      if (p < 1) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.current = target;
        this.display.set(target.toFixed(d));
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }
}

/* ------------------------------------------------------------- PillBadge -- */
@Component({
  selector: 'app-pill-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pill">
      {{ label() }}
    </span>
  `,
  styles: [
    `.pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: var(--r-pill);
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      background: var(--fill);
      color: var(--label-2);
    }`,
  ],
})
export class PillBadgeComponent {
  readonly label = input.required<string>();
  readonly color = input('#007AFF');
  tint = tint;
}

/* ------------------------------------------------------- SoftProgressBar -- */
@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track" [style.height.px]="height()">
      <div
        class="fillbar"
        [style.width.%]="clamped() * 100"
        [style.background]="accentGradient(color())"
      ></div>
    </div>
  `,
  styles: [
    `
      .track {
        width: 100%;
        background: var(--fill);
        border-radius: var(--r-pill);
        overflow: hidden;
      }
      .fillbar {
        height: 100%;
        border-radius: var(--r-pill);
        transition: width var(--dur-slow) var(--ease);
      }
    `,
  ],
})
export class ProgressBarComponent {
  readonly value = input.required<number>();
  readonly color = input('#007AFF');
  readonly height = input(8);
  readonly clamped = computed(() => Math.min(Math.max(this.value(), 0), 1));
  accentGradient = accentGradient;
}

/* -------------------------------------------------------------- StatTile -- */
@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TintedIconComponent],
  template: `
    <div class="tile">
      @if (icon()) {
        <app-tinted-icon [icon]="icon()!" [color]="accent()" [size]="32" />
      }
      <div class="grow"></div>
      <div class="t-stat value" [style.color]="accent()">{{ value() }}</div>
      <div class="t-caption label">{{ label() }}</div>
    </div>
  `,
  styles: [
    `
      .tile {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        height: 100%;
        background: var(--surface);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-soft);
        padding: var(--x4);
      }
      .grow { flex: 1; min-height: var(--x3); }
      .value { white-space: nowrap; }
      .label { margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    `,
  ],
})
export class StatTileComponent {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly accent = input('#007AFF');
  readonly icon = input<string | null>(null);
}

/* ------------------------------------------------------------ EmptyState -- */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TintedIconComponent],
  template: `
    <div class="empty">
      <app-tinted-icon [icon]="icon()" color="#007AFF" [size]="64" />
      <div class="t-headline title">{{ title() }}</div>
      <div class="t-subhead">{{ message() }}</div>
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--x8) var(--x6);
        gap: var(--x1);
      }
      .title { margin-top: var(--x3); }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}

/* ------------------------------------------------------------- CardGroup -- */
@Component({
  selector: 'app-card-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="group">
      @if (header()) {
        <div class="t-section section-header">{{ header() }}</div>
      }
      <div class="card"><ng-content /></div>
      @if (footer()) {
        <div class="t-caption footer">{{ footer() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .group { padding: var(--x5) var(--page) 0; }
      .card {
        background: var(--surface);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .card ::ng-deep > *:not(:last-child) {
        border-bottom: 0.5px solid var(--separator);
      }
      .footer { padding: var(--x2) var(--x2) 0; }
    `,
  ],
})
export class CardGroupComponent {
  readonly header = input<string | null>(null);
  readonly footer = input<string | null>(null);
}

/* --------------------------------------------------------------- CardRow -- */
@Component({
  selector: 'app-card-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="row"
      [class.tappable]="tappable()"
      (pointerdown)="onDown()"
      (click)="onTap()"
    >
      <ng-content select="[slot=leading]" />
      <div class="texts">
        <div class="t-body title">{{ title() }}</div>
        @if (subtitle()) {
          <div class="t-subhead subtitle">{{ subtitle() }}</div>
        }
      </div>
      <ng-content select="[slot=trailing]" />
      @if (tappable() && showChevron()) {
        <app-icon name="chevron-right" [size]="15" class="chev" />
      }
    </div>
  `,
  styles: [
    `
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 13px var(--x4);
        background: transparent;
        transition: background var(--dur-fast) ease-out;
      }
      .row.tappable { cursor: pointer; user-select: none; }
      @media (hover: hover) {
        .row.tappable:hover { background: rgba(238, 242, 248, 0.6); }
      }
      .row.tappable:active { background: var(--fill); }
      .texts { flex: 1; min-width: 0; }
      .title { font-weight: 500; }
      .subtitle {
        margin-top: 2px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .chev { color: var(--label-3); margin-left: -6px; }
    `,
  ],
})
export class CardRowComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly showChevron = input(true);
  readonly tappable = input(true);
  @Output() rowTap = new EventEmitter<void>();

  private settings = inject(AppSettingsService);

  onDown(): void {
    if (this.tappable()) this.settings.selection();
  }
  onTap(): void {
    if (this.tappable()) this.rowTap.emit();
  }
}

/* ----------------------------------------------------------- GlassHeader -- */
@Component({
  selector: 'app-glass-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <header class="bar">
      @if (showBack()) {
        <button class="round-btn pressable" (click)="goBack()" aria-label="Înapoi">
          <app-icon name="chevron-back" [size]="20" />
        </button>
      } @else {
        <ng-content select="[slot=leading]" />
      }
      <div class="title" [class.t-large]="large()" [style.fontSize.px]="titleSize()">
        {{ title() }}
      </div>
      <div class="trailing"><ng-content select="[slot=trailing]" /></div>
    </header>
  `,
  styles: [
    `
      .bar {
        position: fixed;
        top: 0; left: var(--sidebar-w, 0); right: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: var(--x2);
        height: calc(58px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) var(--x3) 0;
        background: rgba(244, 246, 251, 0.55);
        -webkit-backdrop-filter: blur(28px) saturate(1.9);
        backdrop-filter: blur(28px) saturate(1.9);
        border-bottom: 0.5px solid rgba(229, 234, 243, 0.4);
      }
      .title {
        flex: 1;
        font-family: var(--font-display);
        font-weight: 800;
        letter-spacing: -0.6px;
        color: var(--label);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        position: absolute;
        left: 60px; right: 60px;
        pointer-events: none;
      }
      .title.t-large { text-align: left; position: static; pointer-events: auto; }
      .round-btn {
        width: 38px; height: 38px;
        border-radius: 50%;
        border: 0.5px solid rgba(229, 234, 243, 0.8);
        background: rgba(255, 255, 255, 0.88);
        box-shadow: var(--shadow-soft);
        color: var(--blue);
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
        margin-left: var(--x1);
      }
      .trailing { margin-left: auto; display: flex; align-items: center; }

      :host-context(.dark) .bar {
        background: rgba(10, 12, 18, 0.6);
        border-bottom: 0.5px solid rgba(255, 255, 255, 0.07);
      }
      :host-context(.dark) .round-btn {
        background: rgba(30, 34, 46, 0.85);
        border-color: rgba(255, 255, 255, 0.1);
      }
    `,
  ],
})
export class GlassHeaderComponent {
  readonly title = input('');
  readonly showBack = input(true);
  readonly large = input(true);
  readonly titleSize = input(26);

  private location = inject(Location);
  private settings = inject(AppSettingsService);

  goBack(): void {
    this.settings.selection();
    this.location.back();
  }
}

/* ------------------------------------------------------ Cupertino Switch -- */
@Component({
  selector: 'app-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="sw"
      role="switch"
      [attr.aria-checked]="value()"
      [class.on]="value()"
      (click)="toggle()"
    >
      <span class="knob"></span>
    </button>
  `,
  styles: [
    `
      .sw {
        width: 51px; height: 31px;
        border-radius: var(--r-pill);
        border: none;
        background: var(--fill-secondary);
        position: relative;
        transition: background var(--dur-base) var(--ease);
        cursor: pointer;
        flex: none;
        padding: 0;
      }
      .sw.on { background: var(--blue); }
      .knob {
        position: absolute;
        top: 2px; left: 2px;
        width: 27px; height: 27px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        transition: transform var(--dur-base) var(--ease);
      }
      .sw.on .knob { transform: translateX(20px); }
    `,
  ],
})
export class SwitchComponent {
  readonly value = input.required<boolean>();
  @Output() valueChange = new EventEmitter<boolean>();

  private settings = inject(AppSettingsService);

  toggle(): void {
    this.settings.selection();
    this.valueChange.emit(!this.value());
  }
}

/* -------------------------------------------------- Segmented (Subiect/Barem) */
@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg">
      @for (opt of options(); track opt; let i = $index) {
        <button class="opt" [class.active]="i === index()" (click)="select(i)">
          {{ opt }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .seg {
        display: inline-flex;
        background: var(--fill);
        border-radius: 9px;
        padding: 2px;
        gap: 2px;
      }
      .opt {
        border: none;
        background: transparent;
        border-radius: 7px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 500;
        color: var(--label);
        cursor: pointer;
        transition: background var(--dur-fast) ease-out, box-shadow var(--dur-fast) ease-out;
      }
      .opt.active { background: var(--surface); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); font-weight: 600; }
    `,
  ],
})
export class SegmentedComponent {
  readonly options = input.required<string[]>();
  readonly index = input.required<number>();
  @Output() indexChange = new EventEmitter<number>();

  private settings = inject(AppSettingsService);

  select(i: number): void {
    if (i === this.index()) return;
    this.settings.selection();
    this.indexChange.emit(i);
  }
}

/* ------------------------------------------------- Dialog (CupertinoAlert) */
export interface DialogAction {
  label: string;
  style?: 'default' | 'destructive' | 'cancel';
  value: unknown;
}

interface DialogRequest {
  title: string;
  message: string;
  actions: DialogAction[];
  input?: { value: string };
  resolve: (value: unknown) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly current = signal<DialogRequest | null>(null);

  show(title: string, message: string, actions: DialogAction[]): Promise<unknown> {
    return new Promise((resolve) => {
      this.current.set({ title, message, actions, resolve });
    });
  }

  /** Dialog cu câmp de text (echivalent CupertinoTextField în alert). */
  prompt(title: string, initialValue: string): Promise<string | null> {
    return new Promise((resolve) => {
      const input = { value: initialValue };
      this.current.set({
        title,
        message: '',
        input,
        actions: [
          { label: 'Anulează', style: 'cancel', value: null },
          { label: 'Salvează', value: 'SUBMIT' },
        ],
        resolve: (v) => resolve(v === 'SUBMIT' ? input.value.trim() : null),
      });
    });
  }

  alert(title: string, message: string): Promise<unknown> {
    return this.show(title, message, [{ label: 'OK', value: true }]);
  }

  confirm(
    title: string,
    message: string,
    confirmLabel: string,
    cancelLabel: string,
    destructive = false,
  ): Promise<boolean> {
    return this.show(title, message, [
      { label: cancelLabel, style: 'cancel', value: false },
      { label: confirmLabel, style: destructive ? 'destructive' : 'default', value: true },
    ]) as Promise<boolean>;
  }

  dismiss(value: unknown): void {
    const req = this.current();
    if (!req) return;
    this.current.set(null);
    req.resolve(value);
  }
}

@Component({
  selector: 'app-dialog-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dialogs.current(); as dlg) {
      <div class="backdrop">
        <div class="box">
          <div class="content">
            <div class="dtitle">{{ dlg.title }}</div>
            @if (dlg.message) {
              <div class="dmessage">{{ dlg.message }}</div>
            }
            @if (dlg.input; as inp) {
              <input
                class="dinput"
                type="text"
                [value]="inp.value"
                (input)="inp.value = $any($event.target).value"
              />
            }
          </div>
          <div class="actions" [class.stacked]="dlg.actions.length > 2">
            @for (action of dlg.actions; track action.label) {
              <button
                class="action"
                [class.destructive]="action.style === 'destructive'"
                [class.cancel]="action.style === 'cancel'"
                (click)="dialogs.dismiss(action.value)"
              >
                {{ action.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--x8);
        animation: fadeIn var(--dur-fast) ease-out;
      }
      @keyframes fadeIn { from { opacity: 0; } }
      .box {
        width: 100%;
        max-width: 300px;
        border-radius: var(--r-sm);
        background: rgba(250, 251, 253, 0.92);
        -webkit-backdrop-filter: blur(26px);
        backdrop-filter: blur(26px);
        overflow: hidden;
        box-shadow: var(--shadow-floating);
        animation: pop var(--dur-base) var(--spring);
      }
      @keyframes pop { from { transform: scale(1.08); opacity: 0.4; } }
      .content { padding: var(--x5) var(--x4) var(--x4); text-align: center; }
      .dtitle { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; }
      .dmessage { margin-top: 6px; font-size: 13px; line-height: 1.4; color: var(--label); white-space: pre-line; }
      .dinput {
        margin-top: 12px;
        width: 100%;
        border: 0.5px solid var(--separator);
        border-radius: 8px;
        background: var(--surface);
        padding: 8px 10px;
        font-size: 14px;
        outline: none;
      }
      .actions { display: flex; border-top: 0.5px solid var(--separator); }
      .actions.stacked { flex-direction: column; }
      .action {
        flex: 1;
        border: none;
        background: transparent;
        padding: 12px;
        font-size: 17px;
        color: var(--blue);
        cursor: pointer;
        font-weight: 400;
      }
      .action:not(:first-child) { border-left: 0.5px solid var(--separator); }
      .actions.stacked .action:not(:first-child) { border-left: none; border-top: 0.5px solid var(--separator); }
      .action:active { background: var(--fill); }
      .action.destructive { color: var(--red); }
      .action.cancel { font-weight: 600; }

      :host-context(.dark) .box { background: rgba(28, 32, 42, 0.92); }
      :host-context(.dark) .action:active { background: rgba(255, 255, 255, 0.07); }
    `,
  ],
})
export class DialogHostComponent {
  readonly dialogs = inject(DialogService);
}

/* -------------------------------------------------------- SubjectTitleCard */
@Component({
  selector: 'app-subject-title-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="accent" [style.background]="accentColor()"></div>
      <div class="stitle">{{ title() }}</div>
      @if (subtitle()) {
        <div class="t-subhead ssub">{{ subtitle() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .card {
        width: 100%;
        background: var(--surface);
        border-radius: var(--r-xl);
        box-shadow: var(--shadow-soft);
        padding: var(--x5);
      }
      .accent { width: 44px; height: 5px; border-radius: var(--r-pill); }
      .stitle {
        margin-top: var(--x3);
        font-family: var(--font-display);
        font-size: clamp(22px, 8vw, 34px);
        font-weight: 700;
        letter-spacing: -0.8px;
        color: var(--label);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ssub { margin-top: 4px; }
    `,
  ],
})
export class SubjectTitleCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly accentColor = input('#5856D6');
}
