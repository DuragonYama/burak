import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Settings as SettingsIcon, 
  BarChart2, 
  Shield,
  Bug
} from 'lucide-react';
import { AppProvider, useApp } from './AppContext';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Progress } from './components/Progress';
import { UnlockFlow } from './components/UnlockFlow';
import { MilestoneCelebration } from './components/MilestoneCelebration';
import { RestrictedApp } from './types';

function AppContent() {
  const { state, completeOnboarding, updateSettings, addHistory } = useApp();
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [settingsTab, setSettingsTab] = useState<'motivations' | 'passwords' | 'questions' | 'apps' | 'config' | 'goal' | 'smart' | 'vision'>('motivations');
  const [selectedApp, setSelectedApp] = useState<RestrictedApp | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);

  const openSettings = (tab: typeof settingsTab = 'motivations') => {
    setSettingsTab(tab);
    setActiveTab('settings');
  };

  if (!state.onboardingComplete) {
    return (
      <div className="min-h-screen bg-aura-cream flex flex-col items-center justify-center p-8 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-aura-sage text-white rounded-[2rem] flex items-center justify-center shadow-xl"
        >
          <Shield size={48} />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-5xl serif italic">Aura</h1>
          <p className="text-aura-ink/60 max-w-xs mx-auto leading-relaxed">
            Reclaim your focus. We create the friction you need to break impulsive digital habits.
          </p>
        </div>
        <button 
          onClick={completeOnboarding}
          className="w-full max-w-xs py-5 bg-aura-ink text-white rounded-3xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          Begin Journey
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-aura-cream flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 p-6 pt-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Dashboard 
                onAppSelect={setSelectedApp} 
                onManageApps={() => openSettings('apps')}
              />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Settings 
                onBack={() => setActiveTab('home')} 
                initialTab={settingsTab}
              />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Progress />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-aura-sage/5 px-8 py-4 flex justify-between items-center z-40">
        <button 
          onClick={() => setActiveTab('home')}
          className={`p-3 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-aura-sage text-white shadow-md' : 'text-aura-ink/40'}`}
        >
          <Home size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`p-3 rounded-2xl transition-all ${activeTab === 'stats' ? 'bg-aura-sage text-white shadow-md' : 'text-aura-ink/40'}`}
        >
          <BarChart2 size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-aura-sage text-white shadow-md' : 'text-aura-ink/40'}`}
        >
          <SettingsIcon size={24} />
        </button>
      </nav>

      {/* Unlock Flow Overlay */}
      <AnimatePresence>
        {selectedApp && (
          <UnlockFlow 
            app={selectedApp}
            onCancel={() => setSelectedApp(null)}
            onSuccess={() => {
              alert(`Success! You've unlocked ${selectedApp.name} intentionally.`);
              setSelectedApp(null);
            }}
          />
        )}
      </AnimatePresence>

      <MilestoneCelebration />

      {/* Dev Tools Toggle */}
      <button 
        onClick={() => setShowDevTools(!showDevTools)}
        className="fixed top-4 right-4 z-[100] p-2 bg-aura-ink/5 text-aura-ink/20 rounded-full hover:bg-aura-ink/10 transition-colors"
      >
        <Bug size={16} />
      </button>

      {/* Dev Tools Panel */}
      <AnimatePresence>
        {showDevTools && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-16 right-4 z-[100] bg-white p-4 rounded-2xl shadow-2xl border border-aura-sage/20 w-64 space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-aura-ink/40">Developer Tools</h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-2 bg-red-50 text-red-600 text-xs rounded-lg font-medium"
              >
                Reset All Data
              </button>
              <button 
                onClick={() => {
                  updateSettings({
                    ...state.settings,
                    unlockTimerSeconds: 5,
                    unlockWindowSeconds: 5
                  });
                  setShowDevTools(false);
                }}
                className="w-full py-2 bg-aura-sage/10 text-aura-sage text-xs rounded-lg font-medium"
              >
                Fast Unlock (5s)
              </button>
              <button 
                onClick={() => {
                  const now = Date.now();
                  const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
                  const newHistory = [
                    { timestamp: now, appId: 'insta', status: 'resisted', duration: 10 },
                    { timestamp: now - 86400000, appId: 'insta', status: 'resisted', duration: 10 },
                    { timestamp: now - (2 * 86400000), appId: 'insta', status: 'resisted', duration: 10 },
                  ];
                  // @ts-ignore
                  addHistory(newHistory[0]);
                  // @ts-ignore
                  addHistory(newHistory[1]);
                  // @ts-ignore
                  addHistory(newHistory[2]);
                  setShowDevTools(false);
                }}
                className="w-full py-2 bg-purple-50 text-purple-600 text-xs rounded-lg font-medium"
              >
                Mock 3-Day Streak
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
