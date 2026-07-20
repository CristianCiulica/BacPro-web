/** Port 1:1 al lib/features/countdown/models/countdown_model.dart. */

export class CountdownModel {
  constructor(
    public readonly examDate: Date,
    public readonly startDate: Date,
    public readonly now: Date,
  ) {}

  static initial(examDate: Date, startDate: Date): CountdownModel {
    return new CountdownModel(dateOnly(examDate), dateOnly(startDate), dateOnly(new Date()));
  }

  copyWith(patch: { examDate?: Date; startDate?: Date; now?: Date }): CountdownModel {
    return new CountdownModel(
      patch.examDate ?? this.examDate,
      patch.startDate ?? this.startDate,
      patch.now ?? this.now,
    );
  }

  get daysRemaining(): number {
    const diff = Math.floor((this.examDate.getTime() - this.now.getTime()) / 86400000);
    return diff < 0 ? 0 : diff;
  }

  get weeksRemaining(): number {
    return Math.ceil(this.daysRemaining / 7);
  }

  get progressPercent(): number {
    const totalDays = Math.floor((this.examDate.getTime() - this.startDate.getTime()) / 86400000);
    if (totalDays <= 0) return 1;
    const elapsed = Math.floor((this.now.getTime() - this.startDate.getTime()) / 86400000);
    const normalized = Math.min(Math.max(elapsed, 0), totalDays);
    return normalized / totalDays;
  }

  get motivationalMessage(): string {
    if (this.daysRemaining > 90) return 'Ai timp suficient să construiești o bază solidă.';
    if (this.daysRemaining >= 30) return 'E perioada perfectă pentru variante și recapitulare.';
    if (this.daysRemaining >= 7) return 'Focus pe simulări și greșeli frecvente.';
    return 'Recapitulare ușoară. Nu te suprasolicita.';
  }

  toJson(): Record<string, string> {
    return {
      examDate: toIsoDate(this.examDate),
      startDate: toIsoDate(this.startDate),
    };
  }

  static fromJson(json: Record<string, unknown>): CountdownModel {
    return new CountdownModel(
      dateOnly(new Date(json['examDate'] as string)),
      dateOnly(new Date(json['startDate'] as string)),
      dateOnly(new Date()),
    );
  }
}

export function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00:00.000`;
}
