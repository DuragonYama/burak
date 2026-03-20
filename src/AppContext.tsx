import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, UnlockAttempt } from './types';
import { storage } from './services/storage';

interface AppContextType {
  state: AppState;
  updateSettings: (settings: AppState['settings']) => void;
  addHistory: (attempt: UnlockAttempt) => void;
  toggleApp: (appId: string) => void;
  addApp: (name: string, category: string) => void;
  removeApp: (appId: string) => void;
  completeOnboarding: () => void;
  streak: number;
  dismissMilestone: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(storage.load());

  useEffect(() => {
    storage.save(state);
  }, [state]);

  const updateSettings = (settings: AppState['settings']) => {
    setState(prev => ({ ...prev, settings }));
  };

  const addHistory = (attempt: UnlockAttempt) => {
    setState(prev => ({
      ...prev,
      history: [attempt, ...prev.history]
    }));
  };

  const toggleApp = (appId: string) => {
    // This could be used to enable/disable monitoring for an app
  };

  const addApp = (name: string, category: string) => {
    setState(prev => ({
      ...prev,
      restrictedApps: [
        ...prev.restrictedApps,
        { id: Date.now().toString(), name, category }
      ]
    }));
  };

  const removeApp = (appId: string) => {
    setState(prev => ({
      ...prev,
      restrictedApps: prev.restrictedApps.filter(app => app.id !== appId)
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, onboardingComplete: true }));
  };

  const calculateStreak = (history: UnlockAttempt[]) => {
    const resistedDates = history
      .filter(h => h.status === 'resisted')
      .map(h => new Date(h.timestamp).toDateString());
    
    const uniqueDates = Array.from(new Set(resistedDates)).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    if (uniqueDates.length === 0) return 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // If the most recent resisted date is not today or yesterday, streak is 0
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let streak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        streak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i-1]);
        const date = new Date(uniqueDates[i]);
        const diffTime = Math.abs(prevDate.getTime() - date.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    return streak;
  };

  const streak = calculateStreak(state.history);

  const dismissMilestone = () => {
    setState(prev => ({ ...prev, lastMilestoneSeen: streak }));
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      updateSettings, 
      addHistory, 
      toggleApp, 
      addApp, 
      removeApp, 
      completeOnboarding,
      streak,
      dismissMilestone
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
