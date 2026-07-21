/**
 * Despre + Termeni și condiții + Politica de confidențialitate — port al
 * AboutScreen / TermsAndConditionsScreen / PrivacyPolicyScreen (textele
 * legale sunt identice cu cele din aplicația mobilă).
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  CardGroupComponent,
  CardRowComponent,
  GlassHeaderComponent,
  IconComponent,
} from '../../ui/ui';

interface PolicySection {
  heading: string;
  body: string;
}

export const TERMS_SECTIONS: PolicySection[] = [
  {
    heading: '1. Despre aplicație',
    body: 'BacPro este o aplicație educațională pentru organizarea pregătirii la Bacalaureat. Conținutul are rol orientativ și nu înlocuiește materialele oficiale ale Ministerului Educației.',
  },
  {
    heading: '2. Cont utilizator',
    body: 'Ești responsabil pentru datele contului tău și pentru activitatea desfășurată în aplicație. Recomandăm folosirea unei adrese de email valide pentru recuperarea accesului.',
  },
  {
    heading: '3. Utilizarea materialelor',
    body: 'Subiectele, baremele și notițele sunt folosite strict pentru studiu personal. Nu este permisă redistribuirea materialelor în mod care încalcă drepturile autorilor sau sursele oficiale.',
  },
  {
    heading: '4. Limitarea răspunderii',
    body: 'BacPro nu garantează obținerea unei note sau promovarea examenului. Rezultatele depind de pregătirea individuală, iar utilizatorul își asumă deciziile luate pe baza informațiilor din aplicație.',
  },
  {
    heading: '5. Actualizări',
    body: 'Putem actualiza funcțiile, interfața și regulile aplicației pentru îmbunătățire continuă. Continuarea utilizării după update reprezintă acceptarea noilor condiții.',
  },
];

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: '1. Date colectate',
    body: 'Aplicația poate salva local și în Firebase date de profil (nume, email), setări (temă, haptic), sesiuni de studiu, notițe și feedback trimis către dezvoltator.',
  },
  {
    heading: '2. Scopul prelucrării',
    body: 'Datele sunt folosite pentru funcționarea aplicației: sincronizare progres, personalizare experiență și îmbunătățirea produsului.',
  },
  {
    heading: '3. Stocare și securitate',
    body: 'Datele sunt stocate prin servicii Firebase și pe dispozitivul tău (acolo unde este cazul). Aplicăm măsuri tehnice rezonabile pentru protecția informațiilor.',
  },
  {
    heading: '4. Drepturile tale',
    body: 'Poți solicita actualizarea datelor din profil, poți dezactiva anumite funcții (ex. notificări/haptic) și poți șterge istoricul direct din ecranul de setări.',
  },
  {
    heading: '5. Contact',
    body: 'Pentru întrebări legate de confidențialitate, folosește secțiunea „Mesaje dezvoltator" din aplicație.',
  },
];

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardGroupComponent, CardRowComponent, GlassHeaderComponent, IconComponent],
  template: `
    <app-glass-header title="Despre" />
    <div class="page-scroll">
      <div class="hero">
        <img class="logo" src="assets/images/login_hero_mono.jpg" alt="Logo" />
        <div class="brand">BacPro</div>
        <div class="t-subhead" style="margin-top: 4px">Versiunea 1.0.0</div>
      </div>

      <app-card-group header="Aplicație">
        <app-card-row title="Termeni și condiții" (rowTap)="go('/terms')">
          <span slot="leading" class="gicon"><app-icon name="doc-text" [size]="20" /></span>
        </app-card-row>
        <app-card-row title="Politica de confidențialitate" (rowTap)="go('/privacy')">
          <span slot="leading" class="gicon"><app-icon name="lock-shield" [size]="20" /></span>
        </app-card-row>
        <app-card-row title="Evaluează pe App Store" (rowTap)="noop()">
          <span slot="leading" class="gicon"><app-icon name="star" [size]="20" /></span>
        </app-card-row>
      </app-card-group>

      <div class="footer">
        <div class="t-caption" style="color: var(--label-3)">
          Creat cu drag pentru elevii din România.
        </div>
        <div class="t-caption" style="color: var(--label-3); margin-top: var(--x2)">
          © 2025 BacPro
        </div>
      </div>
      <div style="height: var(--x10)"></div>
    </div>
  `,
  styles: [
    `
      .hero { display: flex; flex-direction: column; align-items: center; padding-top: var(--x8); }
      .logo {
        width: 88px; height: 88px;
        object-fit: cover;
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-floating);
      }
      .brand {
        margin-top: var(--x4);
        font-family: var(--font-display);
        font-size: 25px;
        font-weight: 700;
        letter-spacing: -0.6px;
        color: var(--label);
      }
      .footer { margin-top: var(--x10); text-align: center; }
      .gicon {
        width: 40px; height: 40px;
        border-radius: 13px;
        background: var(--fill);
        color: var(--label-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
    `,
  ],
})
export class AboutComponent {
  private router = inject(Router);

  go(route: string): void {
    this.router.navigateByUrl(route);
  }

  noop(): void {}
}

@Component({
  selector: 'app-policy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GlassHeaderComponent],
  template: `
    <app-glass-header [title]="title()" [titleSize]="24" />
    <div class="page-scroll">
      <div class="page-pad" style="padding-top: var(--x5); padding-bottom: var(--x6)">
        <div class="floating-card">
          @for (section of sections(); track section.heading; let last = $last) {
            <div class="t-headline">{{ section.heading }}</div>
            <div class="t-subhead body">{{ section.body }}</div>
            @if (!last) {
              <div class="divider"></div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .body { margin-top: 6px; }
      .divider { height: 1px; background: var(--separator); margin: var(--x4) 0; }
    `,
  ],
})
export class PolicyComponent {
  private route = inject(ActivatedRoute);

  readonly kind = computed(() => this.route.snapshot.data['kind'] as 'terms' | 'privacy');
  readonly title = computed(() =>
    this.kind() === 'terms' ? 'Termeni și condiții' : 'Politica de confidențialitate',
  );
  readonly sections = computed(() =>
    this.kind() === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS,
  );
}
