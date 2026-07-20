/** Port 1:1 al modelelor din lib/src/services/firestore_service.dart. */

export interface UserProfileData {
  name: string;
  email: string;
  school: string;
  selectedProfile: string;
  darkMode: boolean;
  haptics: boolean;
  autoSave: boolean;
  dailyReminder: boolean;
  examAlerts: boolean;
  streakReminder: boolean;
  gradeUpdates: boolean;
  onboardingCompleted: boolean;
  currentGrade: number;
}

export interface AuthUserLike {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export function profileDefaults(user: AuthUserLike): UserProfileData {
  const displayName = user.displayName?.trim() ?? '';
  const email = user.email?.trim() ?? '';
  return {
    name: displayName !== ''
      ? displayName
      : email !== '' ? email.split('@')[0] : 'Utilizator Bac Pro',
    email,
    school: 'Adaugă școala ta',
    selectedProfile: 'Mate-Info',
    darkMode: false,
    haptics: true,
    autoSave: true,
    dailyReminder: true,
    examAlerts: true,
    streakReminder: false,
    gradeUpdates: true,
    onboardingCompleted: false,
    currentGrade: 0,
  };
}

export function profileFromMap(
  data: Record<string, unknown> | undefined,
  user: AuthUserLike,
): UserProfileData {
  const d = profileDefaults(user);
  if (!data) return d;
  const s = (v: unknown, fb: string) =>
    typeof v === 'string' && v.trim() !== '' ? v : fb;
  const b = (v: unknown, fb: boolean) => (typeof v === 'boolean' ? v : fb);
  return {
    name: typeof data['name'] === 'string' && (data['name'] as string).trim() !== ''
      ? (data['name'] as string).trim() : d.name,
    email: typeof data['email'] === 'string' ? (data['email'] as string) : d.email,
    school: s(data['school'], d.school),
    selectedProfile: s(data['selectedProfile'], d.selectedProfile),
    darkMode: b(data['darkMode'], d.darkMode),
    haptics: b(data['haptics'], d.haptics),
    autoSave: b(data['autoSave'], d.autoSave),
    dailyReminder: b(data['dailyReminder'], d.dailyReminder),
    examAlerts: b(data['examAlerts'], d.examAlerts),
    streakReminder: b(data['streakReminder'], d.streakReminder),
    gradeUpdates: b(data['gradeUpdates'], d.gradeUpdates),
    onboardingCompleted: b(data['onboardingCompleted'], d.onboardingCompleted),
    currentGrade: typeof data['currentGrade'] === 'number' ? (data['currentGrade'] as number) : d.currentGrade,
  };
}

export interface StudySession {
  id: string;
  subjectName: string;
  year: string;
  sessionName: string;
  durationSeconds: number;
  estimatedGrade: number;
  notes: string;
  completedAt: Date;
}

export interface DeveloperMessage {
  id: string;
  text: string;
  createdAt: Date;
  status: string;
}

export interface ExamPdfAssets {
  subjectPdfAsset: string;
  answerPdfAsset: string;
}

export interface UserProgress {
  solvedCount: number;
  totalStudySeconds: number;
  averageGrade: number;
  streakDays: number;
  subjectProgress: Map<string, number>;
}

export function progressFromSessions(sessions: StudySession[]): UserProgress {
  const solvedCount = sessions.length;
  const totalSeconds = sessions.reduce((t, s) => t + s.durationSeconds, 0);
  const gradeSum = sessions.reduce((t, s) => t + s.estimatedGrade, 0);
  const subjectCounts = new Map<string, number>();
  for (const s of sessions) {
    subjectCounts.set(s.subjectName, (subjectCounts.get(s.subjectName) ?? 0) + 1);
  }
  const subjectProgress = new Map<string, number>();
  for (const [k, v] of subjectCounts) subjectProgress.set(k, Math.min(v / 10, 1));
  return {
    solvedCount,
    totalStudySeconds: totalSeconds,
    averageGrade: solvedCount === 0 ? 0 : gradeSum / solvedCount,
    streakDays: calculateStreak(sessions),
    subjectProgress,
  };
}

function dateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function calculateStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const days = [...new Set(sessions.map((s) => dateOnly(s.completedAt)))].sort((a, b) => b - a);
  let cursor = dateOnly(new Date());
  const DAY = 86400000;
  if (days[0] < cursor) cursor -= DAY;
  let streak = 0;
  for (const day of days) {
    if (day === cursor) {
      streak++;
      cursor -= DAY;
    } else if (day < cursor) {
      break;
    }
  }
  return streak;
}
