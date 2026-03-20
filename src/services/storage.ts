import { AppState, DEFAULT_SETTINGS, INITIAL_APPS } from '../types';

const STORAGE_KEY = 'aura_app_state';

export const storage = {
  save: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  load: (): AppState => {
    const data = localStorage.getItem(STORAGE_KEY);
    const defaults: AppState = {
      settings: DEFAULT_SETTINGS,
      restrictedApps: INITIAL_APPS,
      history: [],
      onboardingComplete: false,
      lastMilestoneSeen: 0,
    };

    if (!data) return defaults;

    try {
      const parsed = JSON.parse(data);
      return {
        ...defaults,
        ...parsed,
        settings: {
          ...defaults.settings,
          ...(parsed.settings || {}),
          frictionSettings: {
            ...defaults.settings.frictionSettings,
            ...(parsed.settings?.frictionSettings || {})
          }
        },
        restrictedApps: parsed.restrictedApps || defaults.restrictedApps,
        history: parsed.history || defaults.history,
      };
    } catch (e) {
      console.error('Failed to parse storage data', e);
      return defaults;
    }
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
