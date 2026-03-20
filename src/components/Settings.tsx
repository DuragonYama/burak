import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Heart, 
  Key, 
  Eye, 
  Timer, 
  Trash2,
  Plus,
  ChevronLeft,
  Pencil,
  Check,
  X,
  Type,
  Hash,
  Grid3X3
} from 'lucide-react';
import { useApp } from '../AppContext';

interface SettingsProps {
  onBack: () => void;
  initialTab?: 'motivations' | 'passwords' | 'questions' | 'apps' | 'config' | 'goal' | 'smart' | 'vision';
}

const VisionImage: React.FC<{ url: string; index: number; onRemove: () => void }> = ({ url, index, onRemove }) => {
  return (
    <div className="aspect-[4/5] rounded-3xl overflow-hidden relative group shadow-sm border border-aura-sage/5 bg-aura-sage/5">
      <img 
        src={url} 
        alt={`Vision ${index + 1}`} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <button 
        onClick={onRemove}
        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ onBack, initialTab = 'motivations' }) => {
  const { state, updateSettings, addApp, removeApp } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Add states
  const [newMotivation, setNewMotivation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('');
  const [newSmartGoal, setNewSmartGoal] = useState({ text: '', description: '', targetDate: '' });
  const [newPasswordType, setNewPasswordType] = useState<'text' | 'pin' | 'pattern'>('text');
  const [newPin, setNewPin] = useState('');
  const [newPattern, setNewPattern] = useState<number[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  const [goalErrors, setGoalErrors] = useState<{ weekly?: string; monthly?: string; yearly?: string }>({});
  
  // Local state for goals to allow typing while validating hierarchy
  const [localGoals, setLocalGoals] = useState({
    weekly: state.settings.weeklyGoalHours.toString(),
    monthly: state.settings.monthlyGoalHours.toString(),
    yearly: state.settings.yearlyGoalHours.toString()
  });

  const handleGoalInputChange = (key: 'weekly' | 'monthly' | 'yearly', value: string) => {
    const nextLocalGoals = { ...localGoals, [key]: value };
    const val = parseInt(value, 10);

    if (!isNaN(val) && val >= 0) {
      // Dynamic Adjustment: Push parent goals up if subordinate goal increases
      if (key === 'weekly') {
        const currentMonthly = parseInt(nextLocalGoals.monthly, 10) || state.settings.monthlyGoalHours;
        if (val > currentMonthly) {
          nextLocalGoals.monthly = val.toString();
          const currentYearly = parseInt(nextLocalGoals.yearly, 10) || state.settings.yearlyGoalHours;
          if (val > currentYearly) {
            nextLocalGoals.yearly = val.toString();
          }
        }
      } else if (key === 'monthly') {
        const currentYearly = parseInt(nextLocalGoals.yearly, 10) || state.settings.yearlyGoalHours;
        if (val > currentYearly) {
          nextLocalGoals.yearly = val.toString();
        }
      }
    }

    setLocalGoals(nextLocalGoals);
    
    // Clear error if we're typing
    if (goalErrors[key]) {
      const newErrors = { ...goalErrors };
      delete newErrors[key];
      setGoalErrors(newErrors);
    }
  };

  const handleGoalConfirm = (key: 'weekly' | 'monthly' | 'yearly') => {
    const rawValue = localGoals[key];
    const val = parseInt(rawValue, 10);
    
    // If empty or invalid, revert to last valid global state
    if (isNaN(val)) {
      setLocalGoals({ 
        weekly: state.settings.weeklyGoalHours.toString(),
        monthly: state.settings.monthlyGoalHours.toString(),
        yearly: state.settings.yearlyGoalHours.toString()
      });
      return;
    }

    // Validation: Parent goals cannot be manually set below subordinate goals
    let minValue = 0;
    if (key === 'monthly') minValue = state.settings.weeklyGoalHours;
    if (key === 'yearly') minValue = state.settings.monthlyGoalHours;

    if (val < minValue || val < 0) {
      setGoalErrors({ ...goalErrors, [key]: `Value cannot be lower than ${key === 'weekly' ? '0' : key === 'monthly' ? 'Weekly goal' : 'Monthly goal'}` });
      // Revert local state to match global settings
      setLocalGoals({ 
        weekly: state.settings.weeklyGoalHours.toString(),
        monthly: state.settings.monthlyGoalHours.toString(),
        yearly: state.settings.yearlyGoalHours.toString()
      });
      return;
    }

    // Valid: update settings for ALL goals (because of pushing logic)
    const finalWeekly = key === 'weekly' ? val : parseInt(localGoals.weekly, 10);
    const finalMonthly = key === 'monthly' ? val : parseInt(localGoals.monthly, 10);
    const finalYearly = key === 'yearly' ? val : parseInt(localGoals.yearly, 10);

    updateSettings({
      ...state.settings,
      weeklyGoalHours: finalWeekly,
      monthlyGoalHours: finalMonthly,
      yearlyGoalHours: finalYearly
    });
    
    // Clear error
    const newErrors = { ...goalErrors };
    delete newErrors[key];
    setGoalErrors(newErrors);
    
    // Normalize local state
    setLocalGoals({
      weekly: finalWeekly.toString(),
      monthly: finalMonthly.toString(),
      yearly: finalYearly.toString()
    });
  };

  const handleAddMotivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMotivation.trim()) {
      updateSettings({
        ...state.settings,
        motivations: [...state.settings.motivations, { id: Date.now().toString(), text: newMotivation.trim() }]
      });
      setNewMotivation('');
    }
  };

  const handleAddPassword = (e: React.FormEvent) => {
    e.preventDefault();
    let value = '';
    if (newPasswordType === 'text' && newPassword.trim()) {
      value = newPassword.trim().toUpperCase();
    } else if (newPasswordType === 'pin' && newPin.length >= 4) {
      value = newPin;
    } else if (newPasswordType === 'pattern' && newPattern.length >= 4) {
      value = newPattern.join(',');
    }

    if (value) {
      updateSettings({
        ...state.settings,
        passwords: [...state.settings.passwords, { id: Date.now().toString(), value, type: newPasswordType }]
      });
      setNewPassword('');
      setNewPin('');
      setNewPattern([]);
    }
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      updateSettings({
        ...state.settings,
        reflectionQuestions: [...state.settings.reflectionQuestions, { id: Date.now().toString(), text: newQuestion.trim() }]
      });
      setNewQuestion('');
    }
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAppName.trim() && newAppCategory.trim()) {
      addApp(newAppName.trim(), newAppCategory.trim());
      setNewAppName('');
      setNewAppCategory('');
    }
  };

  const handleAddSmartGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSmartGoal.text.trim() && state.settings.smartGoals.length < 3) {
      updateSettings({
        ...state.settings,
        smartGoals: [...state.settings.smartGoals, { ...newSmartGoal, id: Date.now().toString() }]
      });
      setNewSmartGoal({ text: '', description: '', targetDate: '' });
    }
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditValue(text);
  };

  const saveEdit = () => {
    if (!editingId) return;

    if (activeTab === 'motivations') {
      updateSettings({
        ...state.settings,
        motivations: state.settings.motivations.map(m => m.id === editingId ? { ...m, text: editValue } : m)
      });
    } else if (activeTab === 'questions') {
      updateSettings({
        ...state.settings,
        reflectionQuestions: state.settings.reflectionQuestions.map(q => q.id === editingId ? { ...q, text: editValue } : q)
      });
    }

    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const removeMotivation = (id: string) => {
    updateSettings({
      ...state.settings,
      motivations: state.settings.motivations.filter(m => m.id !== id)
    });
  };

  const removeQuestion = (id: string) => {
    updateSettings({
      ...state.settings,
      reflectionQuestions: state.settings.reflectionQuestions.filter(q => q.id !== id)
    });
  };

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateSettings({
        ...state.settings,
        visualAnchors: [...state.settings.visualAnchors, base64String]
      });
    };
    reader.readAsDataURL(file);
  };

  const removeVision = (index: number) => {
    updateSettings({
      ...state.settings,
      visualAnchors: state.settings.visualAnchors.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-aura-sage/10 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl serif italic">Settings</h1>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-1 p-1 bg-aura-sage/5 rounded-2xl">
        {(['motivations', 'smart', 'passwords', 'questions', 'apps', 'goal', 'config', 'vision'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-[calc(25%-4px)] py-3 rounded-xl text-[8.5px] font-bold uppercase tracking-tight transition-all text-center ${
              activeTab === tab 
                ? 'bg-white text-aura-sage shadow-sm' 
                : 'text-aura-ink/40 hover:text-aura-ink/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'motivations' && (
          <div className="space-y-4">
            <h2 className="text-lg serif italic">Your Motivations</h2>
            
            <form onSubmit={handleAddMotivation} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a motivation..."
                value={newMotivation}
                onChange={(e) => setNewMotivation(e.target.value)}
                className="flex-1 p-4 bg-white rounded-2xl border border-aura-sage/10 text-sm outline-none focus:border-aura-sage/30 transition-all"
              />
              <button 
                type="submit"
                disabled={!newMotivation.trim()}
                className="p-4 bg-aura-sage text-white rounded-2xl disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-3">
              {state.settings.motivations.map((m) => (
                <div key={m.id} className="p-4 bg-white rounded-2xl border border-aura-sage/5 flex justify-between items-center gap-3">
                  {editingId === m.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="flex-1 text-sm italic bg-aura-cream/50 p-2 rounded-lg outline-none border border-aura-sage/20"
                    />
                  ) : (
                    <p className="text-sm italic flex-1">"{m.text}"</p>
                  )}
                  <div className="flex items-center gap-2">
                    {editingId === m.id ? (
                      <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600 transition-colors">
                        <Check size={16} />
                      </button>
                    ) : (
                      <button onClick={() => startEditing(m.id, m.text)} className="text-aura-ink/20 hover:text-aura-sage transition-colors">
                        <Pencil size={16} />
                      </button>
                    )}
                    <button onClick={() => removeMotivation(m.id)} className="text-aura-ink/20 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'smart' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl serif italic">SMART Goals</h2>
              <p className="text-sm text-aura-ink/60">Define up to 3 goals to keep you focused during the unlock flow.</p>
            </div>

            <div className="space-y-4">
              {state.settings.smartGoals.map((goal) => (
                <div key={goal.id} className="p-6 bg-white rounded-3xl border border-aura-sage/10 shadow-sm space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-aura-sage">{goal.text}</h4>
                    <button 
                      onClick={() => {
                        updateSettings({
                          ...state.settings,
                          smartGoals: state.settings.smartGoals.filter(g => g.id !== goal.id)
                        });
                      }}
                      className="p-2 text-aura-ink/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-aura-ink/60 leading-relaxed">{goal.description}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-aura-ink/30">
                    <Timer size={12} />
                    Target: {goal.targetDate}
                  </div>
                </div>
              ))}

              {state.settings.smartGoals.length < 3 && (
                <form onSubmit={handleAddSmartGoal} className="p-6 bg-aura-sage/5 rounded-3xl border border-dashed border-aura-sage/20 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-aura-ink/40">Goal Title</label>
                    <input 
                      type="text"
                      value={newSmartGoal.text}
                      onChange={(e) => setNewSmartGoal({ ...newSmartGoal, text: e.target.value })}
                      placeholder="e.g., Read 12 books"
                      className="w-full p-3 bg-white rounded-xl border border-aura-sage/10 text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-aura-ink/40">Description</label>
                    <textarea 
                      value={newSmartGoal.description}
                      onChange={(e) => setNewSmartGoal({ ...newSmartGoal, description: e.target.value })}
                      placeholder="How will you achieve this?"
                      className="w-full p-3 bg-white rounded-xl border border-aura-sage/10 text-sm outline-none h-20 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-aura-ink/40">Target Date</label>
                    <input 
                      type="date"
                      value={newSmartGoal.targetDate}
                      onChange={(e) => setNewSmartGoal({ ...newSmartGoal, targetDate: e.target.value })}
                      className="w-full p-3 bg-white rounded-xl border border-aura-sage/10 text-sm outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newSmartGoal.text.trim()}
                    className="w-full py-3 bg-aura-sage text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus size={18} /> Add SMART Goal
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'passwords' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg serif italic">Friction Keys</h2>
              <p className="text-xs text-aura-ink/40 leading-relaxed">
                Create multiple keys. During unlock, you'll need to recall one. This creates cognitive friction.
              </p>
            </div>

            <div className="flex p-1 bg-aura-sage/5 rounded-2xl gap-1">
              {(['text', 'pin', 'pattern'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewPasswordType(type)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    newPasswordType === type 
                      ? 'bg-white text-aura-sage shadow-sm' 
                      : 'text-aura-ink/40 hover:text-aura-ink/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              {newPasswordType === 'text' && (
                <form onSubmit={handleAddPassword} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New key (e.g. FOCUS)..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 p-4 bg-white rounded-2xl border border-aura-sage/10 text-sm outline-none focus:border-aura-sage/30 transition-all uppercase font-mono tracking-widest"
                  />
                  <button 
                    type="submit"
                    disabled={!newPassword.trim()}
                    className="p-4 bg-aura-sage text-white rounded-2xl disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </form>
              )}

              {newPasswordType === 'pin' && (
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${newPin[i] ? 'border-aura-sage bg-aura-sage/5 text-aura-sage' : 'border-aura-sage/10 text-aura-ink/20'}`}>
                        {newPin[i] ? '•' : ''}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => {
                          if (btn === 'C') setNewPin('');
                          else if (btn === 'OK') handleAddPassword({ preventDefault: () => {} } as any);
                          else if (typeof btn === 'number' && newPin.length < 4) setNewPin(prev => prev + btn);
                        }}
                        className={`h-14 rounded-2xl font-bold text-lg transition-all ${
                          btn === 'OK' ? 'bg-aura-sage text-white disabled:opacity-50' : 'bg-white border border-aura-sage/10 text-aura-sage hover:bg-aura-sage/5'
                        }`}
                        disabled={btn === 'OK' && newPin.length < 4}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newPasswordType === 'pattern' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-4 p-6 bg-white rounded-3xl border border-aura-sage/10 shadow-sm">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (!newPattern.includes(i)) {
                              setNewPattern(prev => [...prev, i]);
                            }
                          }}
                          className={`w-12 h-12 rounded-full border-2 transition-all ${
                            newPattern.includes(i) 
                              ? 'border-aura-sage bg-aura-sage text-white' 
                              : 'border-aura-sage/10 hover:border-aura-sage/30'
                          }`}
                        >
                          {newPattern.indexOf(i) !== -1 ? newPattern.indexOf(i) + 1 : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setNewPattern([])}
                      className="flex-1 py-3 bg-aura-sage/5 text-aura-sage rounded-xl font-bold text-xs uppercase tracking-widest"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => handleAddPassword({ preventDefault: () => {} } as any)}
                      disabled={newPattern.length < 4}
                      className="flex-1 py-3 bg-aura-sage text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      Set Pattern
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {state.settings.passwords.map((p) => {
                const isVisible = visiblePasswords.includes(p.id);
                return (
                  <div key={p.id} className="p-4 bg-white rounded-2xl border border-aura-sage/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-aura-sage/5 rounded-lg text-aura-sage">
                        {p.type === 'text' && <Type size={14} />}
                        {p.type === 'pin' && <Hash size={14} />}
                        {p.type === 'pattern' && <Grid3X3 size={14} />}
                      </div>
                      <span className="font-mono text-sm tracking-widest">
                        {isVisible 
                          ? (p.type === 'pattern' ? p.value.split(',').map(v => parseInt(v) + 1).join('→') : p.value)
                          : (p.type === 'text' ? p.value : '••••')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.type !== 'text' && (
                        <button 
                          onClick={() => setVisiblePasswords(prev => 
                            prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                          )}
                          className="text-aura-ink/20 hover:text-aura-sage transition-colors"
                        >
                          {isVisible ? <X size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                      <button 
                        onClick={() => updateSettings({
                          ...state.settings,
                          passwords: state.settings.passwords.filter(pw => pw.id !== p.id)
                        })}
                        className="text-aura-ink/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <h2 className="text-lg serif italic">Reflection Pool</h2>
            
            <form onSubmit={handleAddQuestion} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-1 p-4 bg-white rounded-2xl border border-aura-sage/10 text-sm outline-none focus:border-aura-sage/30 transition-all"
              />
              <button 
                type="submit"
                disabled={!newQuestion.trim()}
                className="p-4 bg-aura-sage text-white rounded-2xl disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </form>

            <p className="text-xs text-aura-ink/40 leading-relaxed">
              One question will be randomly selected at the end of the unlock flow.
            </p>
            <div className="space-y-3">
              {state.settings.reflectionQuestions.map((q) => (
                <div key={q.id} className="p-4 bg-white rounded-2xl border border-aura-sage/5 flex justify-between items-center gap-3">
                  {editingId === q.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="flex-1 text-sm italic bg-aura-cream/50 p-2 rounded-lg outline-none border border-aura-sage/20"
                    />
                  ) : (
                    <p className="text-sm italic flex-1">"{q.text}"</p>
                  )}
                  <div className="flex items-center gap-2">
                    {editingId === q.id ? (
                      <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600 transition-colors">
                        <Check size={16} />
                      </button>
                    ) : (
                      <button onClick={() => startEditing(q.id, q.text)} className="text-aura-ink/20 hover:text-aura-sage transition-colors">
                        <Pencil size={16} />
                      </button>
                    )}
                    <button onClick={() => removeQuestion(q.id)} className="text-aura-ink/20 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-4">
            <h2 className="text-lg serif italic">Restricted Apps</h2>
            
            <form onSubmit={handleAddApp} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="App Name (e.g. Instagram)"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="flex-1 p-4 bg-white rounded-2xl border border-aura-sage/10 text-sm outline-none focus:border-aura-sage/30 transition-all"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newAppCategory}
                  onChange={(e) => setNewAppCategory(e.target.value)}
                  className="w-1/3 p-4 bg-white rounded-2xl border border-aura-sage/10 text-sm outline-none focus:border-aura-sage/30 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={!newAppName.trim() || !newAppCategory.trim()}
                className="w-full p-4 bg-aura-sage text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={20} /> Add App to Restriction
              </button>
            </form>

            <div className="space-y-3 pt-4">
              {state.restrictedApps.map((app) => (
                <div key={app.id} className="p-4 bg-white rounded-2xl border border-aura-sage/5 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{app.name}</div>
                    <div className="text-[10px] text-aura-ink/40 uppercase tracking-widest">{app.category}</div>
                  </div>
                  <button 
                    onClick={() => removeApp(app.id)}
                    className="p-2 text-aura-ink/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg serif italic">Timer Configuration</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Unlock Delay</span>
                    <span className="font-medium">{state.settings.unlockTimerSeconds}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="300" 
                    step="10"
                    value={state.settings.unlockTimerSeconds}
                    onChange={(e) => updateSettings({ ...state.settings, unlockTimerSeconds: parseInt(e.target.value) })}
                    className="w-full accent-aura-sage"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Unlock Window (at end)</span>
                    <span className="font-medium">{state.settings.unlockWindowSeconds}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    step="5"
                    value={state.settings.unlockWindowSeconds}
                    onChange={(e) => updateSettings({ ...state.settings, unlockWindowSeconds: parseInt(e.target.value) })}
                    className="w-full accent-aura-sage"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg serif italic">Friction Layers</h2>
              <div className="space-y-3">
                {Object.entries(state.settings.frictionSettings).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-aura-sage/5">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <input 
                      type="checkbox" 
                      checked={value}
                      onChange={(e) => updateSettings({
                        ...state.settings,
                        frictionSettings: {
                          ...state.settings.frictionSettings,
                          [key]: e.target.checked
                        }
                      })}
                      className="w-5 h-5 accent-aura-sage"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goal' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg serif italic">Time Goals</h2>
              <div className="p-6 bg-white rounded-[2rem] border border-aura-sage/5 shadow-sm space-y-8">
                {/* Weekly Goal */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-aura-ink/40">Weekly Goal</label>
                    <span className="font-bold text-aura-sage">{state.settings.weeklyGoalHours}h</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        min="0"
                        value={localGoals.weekly}
                        onChange={(e) => handleGoalInputChange('weekly', e.target.value)}
                        onBlur={() => handleGoalConfirm('weekly')}
                        onKeyDown={(e) => e.key === 'Enter' && handleGoalConfirm('weekly')}
                        className={`flex-1 p-4 bg-aura-cream/50 rounded-xl border ${goalErrors.weekly ? 'border-red-400' : 'border-aura-sage/10'} text-sm outline-none transition-all`}
                      />
                      <div className="p-4 bg-aura-sage/10 text-aura-sage rounded-xl font-bold text-[10px] flex items-center">
                        HOURS
                      </div>
                    </div>
                    {goalErrors.weekly && <p className="text-[10px] text-red-500 font-medium">{goalErrors.weekly}</p>}
                  </div>
                </div>

                {/* Monthly Goal */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-aura-ink/40">Monthly Goal</label>
                    <span className="font-bold text-aura-sage">{state.settings.monthlyGoalHours}h</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        min="0"
                        value={localGoals.monthly}
                        onChange={(e) => handleGoalInputChange('monthly', e.target.value)}
                        onBlur={() => handleGoalConfirm('monthly')}
                        onKeyDown={(e) => e.key === 'Enter' && handleGoalConfirm('monthly')}
                        className={`flex-1 p-4 bg-aura-cream/50 rounded-xl border ${goalErrors.monthly ? 'border-red-400' : 'border-aura-sage/10'} text-sm outline-none transition-all`}
                      />
                      <div className="p-4 bg-aura-sage/10 text-aura-sage rounded-xl font-bold text-[10px] flex items-center">
                        HOURS
                      </div>
                    </div>
                    {goalErrors.monthly && <p className="text-[10px] text-red-500 font-medium">{goalErrors.monthly}</p>}
                  </div>
                </div>

                {/* Yearly Goal */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-aura-ink/40">Yearly Goal</label>
                    <span className="font-bold text-aura-sage">{state.settings.yearlyGoalHours}h</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        min="0"
                        value={localGoals.yearly}
                        onChange={(e) => handleGoalInputChange('yearly', e.target.value)}
                        onBlur={() => handleGoalConfirm('yearly')}
                        onKeyDown={(e) => e.key === 'Enter' && handleGoalConfirm('yearly')}
                        className={`flex-1 p-4 bg-aura-cream/50 rounded-xl border ${goalErrors.yearly ? 'border-red-400' : 'border-aura-sage/10'} text-sm outline-none transition-all`}
                      />
                      <div className="p-4 bg-aura-sage/10 text-aura-sage rounded-xl font-bold text-[10px] flex items-center">
                        HOURS
                      </div>
                    </div>
                    {goalErrors.yearly && <p className="text-[10px] text-red-500 font-medium">{goalErrors.yearly}</p>}
                  </div>
                </div>
                
                <div className="p-4 bg-aura-sage/5 rounded-2xl">
                  <p className="text-xs text-aura-ink/60 leading-relaxed italic">
                    Setting goals helps you visualize the cumulative impact of your resisted impulses. 
                    Every 15 minutes saved brings you closer to your targets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'vision' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg serif italic">Your Vision</h2>
              <p className="text-xs text-aura-ink/40 leading-relaxed">
                Upload images that remind you of your long-term goals. These will appear during the unlock flow.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="aspect-[4/5] bg-aura-sage/5 rounded-3xl border-2 border-dashed border-aura-sage/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-aura-sage/10 transition-all">
                <Plus className="text-aura-sage" size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-aura-sage">Upload Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleVisionUpload}
                />
              </label>

              {state.settings.visualAnchors.map((url, index) => (
                <VisionImage 
                  key={index} 
                  url={url} 
                  index={index} 
                  onRemove={() => removeVision(index)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
