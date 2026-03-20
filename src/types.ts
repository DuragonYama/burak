export type AppId = string;

export interface Motivation {
  id: string;
  text: string;
}

export interface Password {
  id: string;
  value: string;
  type: 'text' | 'pin' | 'pattern';
}

export interface RestrictedApp {
  id: AppId;
  name: string;
  icon: string;
  category: string;
}

export interface UnlockAttempt {
  timestamp: number;
  appId: AppId;
  status: 'resisted' | 'unlocked' | 'emergency';
  duration: number; // seconds spent in flow
  journalEntry?: string;
}

export interface ReflectionQuestion {
  id: string;
  text: string;
}

export interface SmartGoal {
  id: string;
  text: string;
  description: string;
  targetDate: string;
}

export interface AppSettings {
  motivations: Motivation[];
  passwords: Password[];
  reflectionQuestions: ReflectionQuestion[];
  visualAnchors: string[]; // URLs or local identifiers
  smartGoals: SmartGoal[];
  unlockTimerSeconds: number;
  unlockWindowSeconds: number; // the window at the end of the timer where password works
  emergencyCooldownMinutes: number;
  weeklyGoalHours: number;
  monthlyGoalHours: number;
  yearlyGoalHours: number;
  frictionSettings: {
    randomDelay: boolean;
    microPrompts: boolean;
    intentTyping: boolean;
    journaling: boolean;
  };
}

export interface AppState {
  settings: AppSettings;
  restrictedApps: RestrictedApp[];
  history: UnlockAttempt[];
  onboardingComplete: boolean;
  lastMilestoneSeen: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  motivations: [
    { id: '1', text: 'I want to be more present with my family.' },
    { id: '2', text: 'I want to finish my project by Friday.' }
  ],
  passwords: [
    { id: '1', value: 'BREATHE', type: 'text' },
    { id: '2', value: 'INTENT', type: 'text' }
  ],
  reflectionQuestions: [
    { id: '1', text: 'Do you really want to open this app?' },
    { id: '2', text: 'Is this aligned with your goals today?' },
    { id: '3', text: 'What were you about to do before opening this?' },
    { id: '4', text: 'How will you feel after spending 30 minutes on this app?' }
  ],
  visualAnchors: [],
  smartGoals: [
    { 
      id: '1', 
      text: 'Read 12 books this year', 
      description: 'Finish one book every month to broaden my perspective.', 
      targetDate: '2026-12-31' 
    },
    { 
      id: '2', 
      text: 'Run a 5k in under 25 mins', 
      description: 'Train 3 times a week to improve my cardiovascular health.', 
      targetDate: '2026-06-15' 
    }
  ],
  unlockTimerSeconds: 60, // Default 1 minute for demo
  unlockWindowSeconds: 15, // Last 15 seconds
  emergencyCooldownMinutes: 10,
  weeklyGoalHours: 5,
  monthlyGoalHours: 20,
  yearlyGoalHours: 100,
  frictionSettings: {
    randomDelay: true,
    microPrompts: true,
    intentTyping: true,
    journaling: true
  }
};

export const INITIAL_APPS: RestrictedApp[] = [
  { id: 'insta', name: 'Instagram', icon: 'Instagram', category: 'Social' },
  { id: 'tiktok', name: 'TikTok', icon: 'Video', category: 'Social' },
  { id: 'twitter', name: 'X (Twitter)', icon: 'Twitter', category: 'Social' }
];
