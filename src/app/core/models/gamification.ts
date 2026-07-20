/** Port 1:1 al modelelor de gamificare din lib/features/gamification/. */

export type BadgeId =
  | 'firstTask'
  | 'sevenDayStreak'
  | 'examWarrior'
  | 'consistentStudent'
  | 'bacMachine'
  | 'nightOwl'
  | 'earlyBird';

export interface BadgeModel {
  id: BadgeId;
  title: string;
  description: string;
  unlockedAt: Date | null;
}

export const badgeIsUnlocked = (b: BadgeModel) => b.unlockedAt !== null;

export interface GamificationModel {
  xpTotal: number;
  streakDays: number;
  lastActiveDate: Date | null;
  lastStreakRewardDate: Date | null;
  completedTasks: number;
  completedStudySessions: number;
  completedExamSimulations: number;
  dailyCompletionBonusDates: Set<string>;
  sessionRewardDates: Set<string>;
  rewardedTaskIds: Set<string>;
  badges: Map<BadgeId, BadgeModel>;
}

export function initialGamification(): GamificationModel {
  const defs: [BadgeId, string, string][] = [
    ['firstTask', 'First Task', 'Completează primul task'],
    ['sevenDayStreak', '7 Day Streak', 'Menține streak 7 zile'],
    ['examWarrior', 'Exam Warrior', 'Finalizează prima simulare'],
    ['consistentStudent', 'Consistent Student', 'Completează 30 task-uri'],
    ['bacMachine', 'Bac Machine', 'Completează 100 task-uri'],
    ['nightOwl', 'Night Owl', 'Sesiune completată după ora 22:00'],
    ['earlyBird', 'Early Bird', 'Sesiune completată înainte de ora 8:00'],
  ];
  const badges = new Map<BadgeId, BadgeModel>();
  for (const [id, title, description] of defs) {
    badges.set(id, { id, title, description, unlockedAt: null });
  }
  return {
    xpTotal: 0,
    streakDays: 0,
    lastActiveDate: null,
    lastStreakRewardDate: null,
    completedTasks: 0,
    completedStudySessions: 0,
    completedExamSimulations: 0,
    dailyCompletionBonusDates: new Set(),
    sessionRewardDates: new Set(),
    rewardedTaskIds: new Set(),
    badges,
  };
}

/* Nivele: 100 XP / nivel, liniar — identic cu aplicația mobilă. */
export const level = (m: GamificationModel) => Math.floor(m.xpTotal / 100) + 1;
export const xpInCurrentLevel = (m: GamificationModel) => m.xpTotal % 100;
export const nextLevelProgress = (m: GamificationModel) => xpInCurrentLevel(m) / 100;
export const xpToNextLevel = (m: GamificationModel) => 100 - xpInCurrentLevel(m);

export function gamificationToJson(m: GamificationModel): Record<string, unknown> {
  return {
    xpTotal: m.xpTotal,
    streakDays: m.streakDays,
    lastActiveDate: m.lastActiveDate?.toISOString() ?? null,
    lastStreakRewardDate: m.lastStreakRewardDate?.toISOString() ?? null,
    completedTasks: m.completedTasks,
    completedStudySessions: m.completedStudySessions,
    completedExamSimulations: m.completedExamSimulations,
    dailyCompletionBonusDates: [...m.dailyCompletionBonusDates],
    sessionRewardDates: [...m.sessionRewardDates],
    rewardedTaskIds: [...m.rewardedTaskIds],
    badges: [...m.badges.values()].map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      unlockedAt: b.unlockedAt?.toISOString() ?? null,
    })),
  };
}

export function gamificationFromJson(json: Record<string, unknown>): GamificationModel {
  const seed = initialGamification();
  const badges = new Map(seed.badges);
  for (const raw of (json['badges'] as unknown[]) ?? []) {
    const b = raw as Record<string, unknown>;
    const id = (b['id'] as BadgeId) ?? 'firstTask';
    if (!badges.has(id)) continue;
    badges.set(id, {
      id,
      title: (b['title'] as string) ?? badges.get(id)!.title,
      description: (b['description'] as string) ?? badges.get(id)!.description,
      unlockedAt: b['unlockedAt'] ? new Date(b['unlockedAt'] as string) : null,
    });
  }
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  const strSet = (v: unknown) =>
    new Set(((v as unknown[]) ?? []).map((x) => String(x)));
  return {
    xpTotal: num(json['xpTotal']),
    streakDays: num(json['streakDays']),
    lastActiveDate: json['lastActiveDate'] ? new Date(json['lastActiveDate'] as string) : null,
    lastStreakRewardDate: json['lastStreakRewardDate'] ? new Date(json['lastStreakRewardDate'] as string) : null,
    completedTasks: num(json['completedTasks']),
    completedStudySessions: num(json['completedStudySessions']),
    completedExamSimulations: num(json['completedExamSimulations']),
    dailyCompletionBonusDates: strSet(json['dailyCompletionBonusDates']),
    sessionRewardDates: strSet(json['sessionRewardDates']),
    rewardedTaskIds: strSet(json['rewardedTaskIds']),
    badges,
  };
}
