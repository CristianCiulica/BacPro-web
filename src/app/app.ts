import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DialogHostComponent } from './ui/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogHostComponent],
  template: `
    <router-outlet />
    <app-dialog-host />
  `,
})
export class App {}
