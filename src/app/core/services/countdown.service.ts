/**
 * Port al lib/features/countdown/services/countdown_service.dart —
 * aceeași cheie de stocare (countdown_model_v1) și aceleași reguli.
 */
import { Injectable, signal } from '@angular/core';

import { CountdownModel, dateOnly } from '../models/countdown';

const STORAGE_KEY = 'countdown_model_v1';
const DEFAULT_EXAM_MONTH = 6;
const DEFAULT_EXAM_DAY = 29;

function computedDefaultExamDate(): Date {
  const now = new Date();
  let candidate = new Date(now.getFullYear(), DEFAULT_EXAM_MONTH - 1, DEFAULT_EXAM_DAY);
  if (candidate.getTime() <= now.getTime()) {
    candidate = new Date(now.getFullYear() + 1, DEFAULT_EXAM_MONTH - 1, DEFAULT_EXAM_DAY);
  }
  return candidate;
}

@Injectable({ providedIn: 'root' })
export class CountdownService {
  readonly model = signal<CountdownModel>(
    CountdownModel.initial(computedDefaultExamDate(), new Date()),
  );

  constructor() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      this.persist(this.model());
      return;
    }
    try {
      const loaded = CountdownModel.fromJson(JSON.parse(raw));
      this.model.set(loaded.copyWith({ now: dateOnly(new Date()) }));
    } catch {
      this.persist(this.model());
    }
  }

  async setExamDate(newDate: Date): Promise<void> {
    const updated = this.model().copyWith({ examDate: dateOnly(newDate), now: dateOnly(new Date()) });
    this.model.set(updated);
    this.persist(updated);
  }

  refreshNow(): void {
    this.model.set(this.model().copyWith({ now: dateOnly(new Date()) }));
  }

  private persist(model: CountdownModel): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model.toJson()));
  }
}
