import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Calendar,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { RestrictedApp } from '../types';

interface DashboardProps {
  onAppSelect: (app: RestrictedApp) => void;
  onManageApps: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAppSelect, onManageApps }) => {
  const { state, streak, removeHistory } = useApp();

  const resistedCount = (state.history || []).filter(h => h.status === 'resisted').length;
  const totalTimeSaved = (state.history || [])
    .filter(h => h.status === 'resisted' && h.intendedDuration)
    .reduce((sum, h) => sum + (h.intendedDuration || 0), 0);

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl serif italic">Welcome back</h1>
        <p className="text-aura-ink/60">Your mindful journey continues.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-6 bg-white rounded-[2rem] border border-aura-sage/10 shadow-sm space-y-4"
        >
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-2xl font-light">{resistedCount}</div>
            <div className="text-xs text-aura-ink/40 uppercase tracking-widest">Resisted</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="p-6 bg-white rounded-[2rem] border border-aura-sage/10 shadow-sm space-y-4"
        >
          <div className="w-10 h-10 bg-aura-sage/10 text-aura-sage rounded-2xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-2xl font-light">{streak}d</div>
            <div className="text-xs text-aura-ink/40 uppercase tracking-widest">Current Streak</div>
          </div>
        </motion.div>
      </div>

      {/* Time Saved Summary */}
      <section className="p-8 bg-aura-sage text-white rounded-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-white/60 uppercase tracking-widest text-[10px] font-bold">
            <Clock size={14} />
            Focus Time Reclaimed
          </div>
          <div className="space-y-1">
            <div className="text-5xl font-light">{totalTimeSaved}<span className="text-xl ml-1 opacity-60">mins</span></div>
            <p className="text-sm text-white/80 italic">That's enough time to read a few chapters or take a long walk.</p>
          </div>
        </div>
        {/* Abstract background element */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      </section>

      {/* App List */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl serif italic">Restricted Apps</h2>
          <button 
            onClick={onManageApps}
            className="text-aura-sage text-sm font-medium flex items-center gap-1"
          >
            <Plus size={16} /> Manage
          </button>
        </div>
        <div className="space-y-3">
          {(state.restrictedApps || []).map((app) => (
            <motion.button
              key={app.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAppSelect(app)}
              className="w-full p-5 bg-white rounded-3xl border border-aura-sage/5 shadow-sm flex items-center justify-between group hover:border-aura-sage/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-aura-cream rounded-2xl flex items-center justify-center text-aura-sage">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <div className="font-medium">{app.name}</div>
                  <div className="text-xs text-aura-ink/40">{app.category}</div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-aura-cream flex items-center justify-center text-aura-sage/40 group-hover:text-aura-sage transition-colors">
                <ChevronRight size={18} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Progress Visualization */}
      <section className="space-y-4">
        <h2 className="text-xl serif italic">Mindfulness Progress</h2>
        <div className="p-6 bg-white rounded-[2rem] border border-aura-sage/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-xs text-aura-ink/40 uppercase tracking-widest font-bold">Resisted vs Unlocked</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-[10px] text-aura-ink/40">
                <div className="w-2 h-2 rounded-full bg-aura-sage" /> Resisted
              </div>
              <div className="flex items-center gap-1 text-[10px] text-aura-ink/40">
                <div className="w-2 h-2 rounded-full bg-aura-sage/20" /> Unlocked
              </div>
            </div>
          </div>
          
          <div className="h-4 flex rounded-full bg-aura-sage/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(resistedCount / (resistedCount + (state.history || []).filter(h => h.status === 'unlocked').length || 1)) * 100}%` }}
              className="bg-aura-sage"
            />
          </div>
          
          <p className="text-xs text-aura-ink/60 text-center italic">
            "Every resisted impulse is a victory for your future self."
          </p>
        </div>
      </section>

      {/* Recent Reflections */}
      {(state.history || []).some(h => h.journalEntry) && (
        <section className="space-y-4">
          <h2 className="text-xl serif italic">Recent Reflections</h2>
          <div className="space-y-3">
            {(state.history || [])
              .filter(h => h.journalEntry)
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 3)
              .map((h, i) => (
                <div key={i} className="p-5 bg-white rounded-3xl border border-aura-sage/5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-aura-sage font-bold uppercase tracking-widest">
                      {(state.restrictedApps || []).find(a => a.id === h.appId)?.name || 'Unknown App'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-aura-ink/40">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => removeHistory(h.timestamp)}
                        className="text-aura-ink/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm italic text-aura-ink/80">"{h.journalEntry}"</p>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
