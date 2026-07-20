/**
 * Port al lib/features/gamification/services/gamification_service.dart.
 * Aceleași reguli XP (+25 sesiune/zi, +100 simulare, +15 bonus zilnic de
 * streak), aceeași logică de streak și aceleași 7 badge-uri; stocare în
 * localStorage sub aceeași cheie (gamification_model_v1).
 */
import { Injectable, signal } from '@angular/core';

import {
  BadgeId,
  GamificationModel,
  gamificationFromJson,
  gamificationToJson,
  initialGamification,
} from '../models/gamification';

const STORAGE_KEY = 'gamification_model_v1';

@Injectable({ providedIn: 'root' })
export class GamificationService {
  readonly model = signal<GamificationModel>(initialGamification());

  constructor() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      try {
        this.model.set(gamificationFromJson(JSON.parse(raw)));
      } catch {
        // model corupt — pornim de la zero, identic cu comportamentul mobil
      }
    }
  }

  async recordStudySessionCompleted(completedAt: Date, isSimulation = false): Promise<boolean> {
    let m = { ...this.model() };
    const key = dayKey(completedAt);
    if (m.sessionRewardDates.has(key)) return false;

    m = this.applyDailyStreak(m, completedAt);
    m = {
      ...m,
      xpTotal: m.xpTotal + 25,
      completedStudySessions: m.completedStudySessions + 1,
      sessionRewardDates: new Set([...m.sessionRewardDates, key]),
    };

    if (isSimulation) {
      m = {
        ...m,
        xpTotal: m.xpTotal + 100,
        completedExamSimulations: m.completedExamSimulations + 1,
      };
    }

    m = this.applyBadges(m, completedAt);
    this.model.set(m);
    this.persist(m);
    return true;
  }

  private applyDailyStreak(m: GamificationModel, now: Date): GamificationModel {
    const today = dateOnly(now);
    const lastActive = m.lastActiveDate ? dateOnly(m.lastActiveDate) : null;
    const lastRewarded = m.lastStreakRewardDate ? dateOnly(m.lastStreakRewardDate) : null;

    let streak = m.streakDays;
    if (lastActive === null) {
      streak = 1;
    } else {
      const gap = Math.round((today.getTime() - lastActive.getTime()) / 86400000);
      if (gap === 0) streak = m.streakDays;
      else if (gap === 1) streak = m.streakDays + 1;
      else streak = 1;
    }

    let xp = m.xpTotal;
    if (lastRewarded === null || today.getTime() - lastRewarded.getTime() > 0) {
      xp += 15;
    }

    return {
      ...m,
      xpTotal: xp,
      streakDays: streak,
      lastActiveDate: today,
      lastStreakRewardDate: today,
    };
  }

  private applyBadges(m: GamificationModel, at: Date): GamificationModel {
    const badges = new Map(m.badges);
    const unlock = (id: BadgeId) => {
      const existing = badges.get(id);
      if (!existing || existing.unlockedAt !== null) return;
      badges.set(id, { ...existing, unlockedAt: at });
    };

    if (m.completedTasks >= 1) unlock('firstTask');
    if (m.streakDays >= 7) unlock('sevenDayStreak');
    if (m.completedExamSimulations >= 1) unlock('examWarrior');
    if (m.completedTasks >= 30) unlock('consistentStudent');
    if (m.completedTasks >= 100) unlock('bacMachine');
    if (at.getHours() >= 22) unlock('nightOwl');
    if (at.getHours() < 8) unlock('earlyBird');

    return { ...m, badges };
  }

  private persist(m: GamificationModel): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gamificationToJson(m)));
  }
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
