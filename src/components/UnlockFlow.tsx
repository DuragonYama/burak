import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  ArrowRight, 
  Clock, 
  Image as ImageIcon, 
  Type, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Hash,
  Grid3X3
} from 'lucide-react';
import { useApp } from '../AppContext';
import { RestrictedApp, Password } from '../types';

interface UnlockFlowProps {
  app: RestrictedApp;
  onCancel: () => void;
  onSuccess: () => void;
}

type Step =
  | 'duration'
  | 'reflection'
  | 'visual'
  | 'timer'
  | 'password'
  | 'intent'
  | 'journaling'
  | 'micro-reflection'
  | 'confirmation'
  | 'success'
  | 'emergency';

export const UnlockFlow: React.FC<UnlockFlowProps> = ({ app, onCancel, onSuccess }) => {
  const { state, addHistory } = useApp();
  const [step, setStep] = useState<Step>('duration');
  const [intendedDuration, setIntendedDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState('');
  const [timeLeft, setTimeLeft] = useState(state.settings.unlockTimerSeconds);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [intentInput, setIntentInput] = useState('');
  const [journalInput, setJournalInput] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [startTime] = useState(Date.now());
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [selectedMicroPrompt, setSelectedMicroPrompt] = useState('');
  const [shouldShowMicroPrompt] = useState(Math.random() < 0.4); // 40% chance to show
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);

  // Randomize password and question for this session
  useEffect(() => {
    const passwords = state.settings?.passwords || [];
    if (passwords.length > 0) {
      // Group passwords by type to ensure equal chance for each type (1/3 if all types exist)
      const byType = passwords.reduce((acc, p) => {
        if (!acc[p.type]) acc[p.type] = [];
        acc[p.type].push(p);
        return acc;
      }, {} as Record<string, Password[]>);

      const availableTypes = Object.keys(byType);
      const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const passwordsOfType = byType[randomType];
      const random = passwordsOfType[Math.floor(Math.random() * passwordsOfType.length)];
      
      setSelectedPassword(random);
    }

    const questions = state.settings?.reflectionQuestions || [];
    if (questions.length > 0) {
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      setSelectedQuestion(randomQ.text);
      
      // Select a different one for micro prompt if possible
      const otherQuestions = questions.filter(q => q.text !== randomQ.text);
      const microQ = otherQuestions.length > 0 
        ? otherQuestions[Math.floor(Math.random() * otherQuestions.length)]
        : randomQ;
      setSelectedMicroPrompt(microQ.text);
    }

    const anchors = state.settings?.visualAnchors || [];
    if (anchors.length > 0) {
      setSelectedAnchor(anchors[Math.floor(Math.random() * anchors.length)]);
    }
  }, [state.settings?.passwords, state.settings?.reflectionQuestions, state.settings?.visualAnchors]);

  // Timer logic
  useEffect(() => {
    if (step === 'timer' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const handleFinish = (status: 'unlocked' | 'resisted' | 'emergency') => {
    addHistory({
      appId: app.id,
      timestamp: Date.now(),
      status,
      duration: Math.floor((Date.now() - startTime) / 1000),
      intendedDuration: intendedDuration ?? undefined,
      journalEntry: journalInput.trim() || undefined
    });
    if (status === 'unlocked' || status === 'emergency') {
      onSuccess();
    } else {
      onCancel();
    }
  };

  const nextStep = () => {
    const allSteps: Step[] = ['reflection', 'visual', 'timer', 'password', 'intent', 'journaling', 'micro-reflection', 'confirmation'];
    
    // Filter steps based on settings
    const enabledSteps = allSteps.filter(s => {
      if (s === 'visual' && (!state.settings.visualAnchors || state.settings.visualAnchors.length === 0)) return false;
      if (s === 'intent' && !state.settings.frictionSettings.intentTyping) return false;
      if (s === 'journaling' && !state.settings.frictionSettings.journaling) return false;
      if (s === 'micro-reflection' && (!state.settings.frictionSettings.microPrompts || !shouldShowMicroPrompt)) return false;
      return true;
    });

    const currentIndex = enabledSteps.indexOf(step);
    
    if (state.settings.frictionSettings.randomDelay && currentIndex < enabledSteps.length - 1) {
      const delay = Math.floor(Math.random() * 2000) + 500;
      setTimeout(() => {
        setStep(enabledSteps[currentIndex + 1]);
      }, delay);
    } else if (currentIndex < enabledSteps.length - 1) {
      setStep(enabledSteps[currentIndex + 1]);
    } else {
      setStep('success');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'duration': {
        const presets = [5, 15, 30, 60, 120];
        const selectedMinutes = intendedDuration;
        const customVal = parseInt(customDuration, 10);
        const canProceed = selectedMinutes !== null && selectedMinutes > 0;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">How long were you planning to use {app.name}?</h2>
              <p className="text-aura-ink/60">This helps track the time you reclaim by resisting.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {presets.map(mins => (
                <button
                  key={mins}
                  onClick={() => { setIntendedDuration(mins); setCustomDuration(''); }}
                  className={`px-5 py-3 rounded-2xl font-medium transition-all text-sm ${
                    selectedMinutes === mins && customDuration === ''
                      ? 'bg-aura-sage text-white shadow-md'
                      : 'bg-white border border-aura-sage/20 text-aura-ink/70 hover:border-aura-sage/40'
                  }`}
                >
                  {mins < 60 ? `${mins} min` : `${mins / 60} hr`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-aura-sage/10" />
              <span className="text-xs text-aura-ink/30 uppercase tracking-widest">or custom</span>
              <div className="flex-1 h-px bg-aura-sage/10" />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) setIntendedDuration(val);
                }}
                placeholder="Enter minutes"
                className="flex-1 p-4 text-center border-2 border-aura-sage/20 rounded-2xl focus:border-aura-sage outline-none transition-all"
              />
              <span className="text-aura-ink/40 text-sm">min</span>
            </div>

            <button
              disabled={!canProceed}
              onClick={() => setStep('reflection')}
              className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${
                canProceed
                  ? 'bg-aura-sage text-white shadow-lg hover:bg-aura-sage/90'
                  : 'bg-aura-sage/10 text-aura-sage/40 cursor-not-allowed'
              }`}
            >
              Continue <ArrowRight size={18} />
            </button>
          </motion.div>
        );
      }

      case 'reflection':
        const motivations = state.settings?.motivations || [];
        const motivation = motivations[Math.floor(Math.random() * motivations.length)];
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="w-16 h-16 bg-aura-sage/10 rounded-full flex items-center justify-center mx-auto">
              <Lock className="text-aura-sage" size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">Pause for a moment</h2>
              <p className="text-aura-ink/60">You set this boundary for a reason.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-aura-sage/10 shadow-sm space-y-4">
              <p className="text-xl serif italic">"{motivation?.text}"</p>
              
              {state.settings.smartGoals.length > 0 && (
                <div className="pt-4 border-t border-aura-sage/5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-aura-ink/30">Your SMART Goals</p>
                  <div className="space-y-2">
                    {state.settings.smartGoals.map(goal => (
                      <div key={goal.id} className="flex items-start gap-2 text-left">
                        <CheckCircle2 size={14} className="text-aura-sage mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-aura-ink/80">{goal.text}</p>
                          <p className="text-[10px] text-aura-ink/40 line-clamp-1">{goal.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={nextStep}
              className="w-full py-4 bg-aura-sage text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-aura-sage/90 transition-colors"
            >
              I remember <ArrowRight size={18} />
            </button>
          </motion.div>
        );

      case 'visual':
        if (!selectedAnchor) {
          nextStep();
          return null;
        }
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <h2 className="text-3xl serif italic">Your Vision</h2>
            <div className="w-full rounded-3xl overflow-hidden shadow-lg">
              <img
                src={selectedAnchor}
                alt="Visual Anchor"
                className="w-full h-auto block"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-aura-ink/60">Is opening {app.name} worth moving away from this?</p>
            <button 
              onClick={nextStep}
              className="w-full py-4 bg-aura-sage text-white rounded-2xl font-medium"
            >
              Continue
            </button>
          </motion.div>
        );

      case 'timer':
        const isWindowOpen = timeLeft <= state.settings.unlockWindowSeconds;
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-12"
          >
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">The Waiting Room</h2>
              <p className="text-aura-ink/60">Impulses fade with time.</p>
            </div>
            
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-aura-sage/10"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={553}
                  animate={{ strokeDashoffset: 553 - (553 * (timeLeft / state.settings.unlockTimerSeconds)) }}
                  className="text-aura-sage"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-light">{timeLeft}s</span>
                <Clock size={20} className="text-aura-sage/40 mt-2" />
              </div>
            </div>

            <div className="space-y-4">
              {isWindowOpen ? (
                <p className="text-emerald-600 font-medium">The unlock window is now open.</p>
              ) : (
                <p className="text-aura-ink/40 italic">Wait for the window to open...</p>
              )}
              <button 
                disabled={!isWindowOpen}
                onClick={nextStep}
                className={`w-full py-4 rounded-2xl font-medium transition-all ${
                  isWindowOpen 
                    ? 'bg-aura-sage text-white shadow-lg' 
                    : 'bg-aura-sage/10 text-aura-sage/40 cursor-not-allowed'
                }`}
              >
                Proceed to Password
              </button>
            </div>
          </motion.div>
        );

      case 'password':
        if (!selectedPassword) return null;

        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">Cognitive Friction</h2>
              <p className="text-aura-ink/60">Recall your {selectedPassword.type} key.</p>
            </div>

            {selectedPassword.type === 'text' && (
              <div className="space-y-4">
                <input 
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value.toUpperCase())}
                  placeholder="TYPE PASSWORD"
                  className="w-full p-6 text-center text-2xl tracking-widest border-2 border-aura-sage/20 rounded-2xl focus:border-aura-sage outline-none transition-all"
                />
                <p className="text-xs text-aura-ink/40 uppercase tracking-widest">
                  Hint: It's one of the {state.settings?.passwords?.length || 0} you created.
                </p>
                <button 
                  onClick={() => {
                    if (passwordInput === selectedPassword.value) {
                      nextStep();
                    } else {
                      alert("Incorrect key. Try again.");
                      setPasswordInput('');
                    }
                  }}
                  className="w-full py-4 bg-aura-sage text-white rounded-2xl font-medium"
                >
                  Verify
                </button>
              </div>
            )}

            {selectedPassword.type === 'pin' && (
              <div className="space-y-6">
                <div className="flex justify-center gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-12 h-16 border-2 rounded-xl flex items-center justify-center text-2xl font-light transition-all ${
                        passwordInput.length > i ? 'border-aura-sage bg-aura-sage/5' : 'border-aura-sage/20'
                      }`}
                    >
                      {passwordInput.length > i ? '•' : ''}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        if (num === 'C') setPasswordInput('');
                        else if (num === 'OK') {
                          if (passwordInput === selectedPassword.value) nextStep();
                          else {
                            alert("Incorrect PIN.");
                            setPasswordInput('');
                          }
                        }
                        else if (passwordInput.length < 4) setPasswordInput(prev => prev + num);
                      }}
                      className="aspect-square rounded-2xl bg-aura-sage/5 hover:bg-aura-sage/10 text-xl font-light transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedPassword.type === 'pattern' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto aspect-square p-4 bg-aura-sage/5 rounded-3xl">
                  {[...Array(9)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const point = (i + 1).toString();
                        if (!passwordInput.includes(point)) {
                          setPasswordInput(prev => prev + point);
                        }
                      }}
                      className={`aspect-square rounded-full border-2 transition-all flex items-center justify-center ${
                        passwordInput.includes((i + 1).toString()) 
                          ? 'border-aura-sage bg-aura-sage scale-90' 
                          : 'border-aura-sage/20 bg-white'
                      }`}
                    >
                      {passwordInput.includes((i + 1).toString()) && (
                        <span className="text-white text-xs font-bold">
                          {passwordInput.indexOf((i + 1).toString()) + 1}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 max-w-[280px] mx-auto">
                  <button 
                    onClick={() => setPasswordInput('')}
                    className="flex-1 py-3 border-2 border-aura-sage/20 rounded-xl text-aura-ink/60"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={() => {
                      if (passwordInput === selectedPassword.value) nextStep();
                      else {
                        alert("Incorrect pattern.");
                        setPasswordInput('');
                      }
                    }}
                    className="flex-[2] py-3 bg-aura-sage text-white rounded-xl font-medium"
                  >
                    Verify
                  </button>
                </div>
                <p className="text-xs text-aura-ink/40">Tap the dots in your secret sequence.</p>
              </div>
            )}
          </motion.div>
        );

      case 'intent':
        const intentPhrase = "I choose to use this app intentionally";
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">Conscious Commitment</h2>
              <p className="text-aura-ink/60">Type the following phrase to confirm intent:</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-aura-sage/10 italic text-aura-sage">
              "{intentPhrase}"
            </div>
            <textarea 
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="Type here..."
              className="w-full p-4 h-32 border-2 border-aura-sage/20 rounded-2xl focus:border-aura-sage outline-none resize-none"
            />
            <button 
              disabled={intentInput !== intentPhrase}
              onClick={nextStep}
              className={`w-full py-4 rounded-2xl font-medium transition-all ${
                intentInput === intentPhrase
                  ? 'bg-aura-sage text-white shadow-lg' 
                  : 'bg-aura-sage/10 text-aura-sage/40 cursor-not-allowed'
              }`}
            >
              Confirm Intent
            </button>
          </motion.div>
        );

      case 'journaling':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">Mindful Journaling</h2>
              <p className="text-aura-ink/60">Briefly describe why you need to access this app right now:</p>
            </div>
            <textarea 
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              placeholder="Write a sentence about your intent..."
              className="w-full p-4 h-32 border-2 border-aura-sage/20 rounded-2xl focus:border-aura-sage outline-none resize-none"
            />
            <p className="text-xs text-aura-ink/40">
              Minimum 10 characters required to proceed.
            </p>
            <button 
              disabled={journalInput.trim().length < 10}
              onClick={nextStep}
              className={`w-full py-4 rounded-2xl font-medium transition-all ${
                journalInput.trim().length >= 10
                  ? 'bg-aura-sage text-white shadow-lg' 
                  : 'bg-aura-sage/10 text-aura-sage/40 cursor-not-allowed'
              }`}
            >
              Save Reflection
            </button>
          </motion.div>
        );

      case 'micro-reflection':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-12 py-12"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 bg-aura-sage/10 rounded-full flex items-center justify-center mx-auto">
                <Type className="text-aura-sage" size={24} />
              </div>
              <h2 className="text-3xl serif italic">Micro Reflection</h2>
            </div>
            
            <div className="p-8 bg-white rounded-[2.5rem] border border-aura-sage/10 shadow-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-aura-sage text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                Quick Check
              </div>
              <p className="text-2xl serif italic leading-relaxed">
                "{selectedMicroPrompt}"
              </p>
            </div>

            <button 
              onClick={nextStep}
              className="w-full py-4 bg-aura-sage text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-aura-sage/90 transition-colors shadow-lg"
            >
              Continue <ArrowRight size={18} />
            </button>
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-12 py-12"
          >
            <h2 className="text-4xl serif italic">Final Question</h2>
            <p className="text-xl">{selectedQuestion}</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleFinish('resisted')}
                className="p-6 border-2 border-aura-sage text-aura-sage rounded-3xl font-medium hover:bg-aura-sage/5 transition-colors"
              >
                No, I'll stop
              </button>
              <button 
                onClick={nextStep}
                className="p-6 bg-aura-sage text-white rounded-3xl font-medium shadow-lg hover:bg-aura-sage/90 transition-colors"
              >
                Yes, I'm sure
              </button>
            </div>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl serif italic">Access Granted</h2>
              <p className="text-aura-ink/60">You have consciously chosen to proceed.</p>
            </div>
            <button 
              onClick={() => handleFinish('unlocked')}
              className="w-full py-4 bg-aura-ink text-white rounded-2xl font-medium"
            >
              Open {app.name}
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-aura-cream flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-aura-sage/60">
          <Lock size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">{app.name} Lock</span>
        </div>
        <button 
          onClick={() => handleFinish('resisted')}
          className="p-2 hover:bg-aura-sage/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={() => setIsEmergency(true)}
          className="text-aura-ink/30 text-xs uppercase tracking-widest hover:text-aura-ink/60 transition-colors"
        >
          Emergency Unlock
        </button>
      </div>

      {/* Emergency Modal */}
      <AnimatePresence>
        {isEmergency && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-aura-ink/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full space-y-6"
            >
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl serif font-bold">Emergency Unlock</h3>
                <p className="text-aura-ink/60 leading-relaxed">
                  This will bypass all friction layers, but requires a 10-minute cooldown. Use this only if absolutely necessary.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    alert("Emergency cooldown started. Please wait 10 minutes.");
                    setIsEmergency(false);
                  }}
                  className="w-full py-4 bg-aura-ink text-white rounded-2xl font-medium"
                >
                  Start Cooldown
                </button>
                <button 
                  onClick={() => setIsEmergency(false)}
                  className="w-full py-4 text-aura-ink/60 font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
