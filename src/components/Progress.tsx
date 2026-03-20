import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  endOfMonth,
  startOfYear,
  setMonth,
  eachMonthOfInterval,
  isWithinInterval,
  parseISO,
  getWeek
} from 'date-fns';
import { useApp } from '../AppContext';
import { Clock, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

type ViewType = 'weekly' | 'monthly' | 'yearly';

export const Progress: React.FC = () => {
  const { state } = useApp();
  const [view, setView] = useState<ViewType>('weekly');

  // Reference date from metadata: 2026-03-09
  const now = useMemo(() => new Date('2026-03-09T01:30:37-07:00'), []);

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const history = useMemo(() => state.history || [], [state.history]);
  const resistedAttempts = useMemo(() => history.filter(h => h.status === 'resisted'), [history]);

  const totalMinutesSaved = useMemo(() => resistedAttempts.length * 15, [resistedAttempts]);

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const weeklyData = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayResisted = resistedAttempts.filter(h => isSameDay(new Date(h.timestamp), day));
      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        minutes: dayResisted.length * 15,
      };
    });
  }, [resistedAttempts, now]);

  const allMonthlyData = useMemo(() => {
    const yearStart = new Date(selectedYear, 0, 1);
    const months = Array.from({ length: 12 }, (_, i) => setMonth(yearStart, i));

    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const days = eachDayOfInterval({ start, end });

      return {
        monthName: format(month, 'MMMM'),
        data: days.map(day => {
          const dayResisted = resistedAttempts.filter(h => isSameDay(new Date(h.timestamp), day));
          return {
            name: format(day, 'd'),
            fullDate: format(day, 'MMM d, yyyy'),
            minutes: dayResisted.length * 15,
          };
        })
      };
    });
  }, [resistedAttempts, selectedYear]);

  const availableYears = useMemo(() => {
    const years = new Set([now.getFullYear()]);
    history.forEach(h => years.add(new Date(h.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [history, now]);

  // Goals
  const weeklyGoal = useMemo(() => state.settings.weeklyGoalHours * 60, [state.settings.weeklyGoalHours]);
  const monthlyGoal = useMemo(() => state.settings.monthlyGoalHours * 60, [state.settings.monthlyGoalHours]);
  const yearlyGoal = useMemo(() => state.settings.yearlyGoalHours * 60, [state.settings.yearlyGoalHours]);

  // Track goal increases for red bar animation
  const [increasedGoals, setIncreasedGoals] = useState<{ weekly: boolean; monthly: boolean; yearly: boolean }>({
    weekly: false,
    monthly: false,
    yearly: false
  });

  const prevGoals = useRef({ weekly: weeklyGoal, monthly: monthlyGoal, yearly: yearlyGoal });

  useEffect(() => {
    const newIncreased = { ...increasedGoals };
    let changed = false;

    if (weeklyGoal > prevGoals.current.weekly) {
      newIncreased.weekly = true;
      changed = true;
    }
    if (monthlyGoal > prevGoals.current.monthly) {
      newIncreased.monthly = true;
      changed = true;
    }
    if (yearlyGoal > prevGoals.current.yearly) {
      newIncreased.yearly = true;
      changed = true;
    }

    if (changed) {
      setIncreasedGoals(newIncreased);
      const timer = setTimeout(() => {
        setIncreasedGoals({ weekly: false, monthly: false, yearly: false });
      }, 2000);
      prevGoals.current = { weekly: weeklyGoal, monthly: monthlyGoal, yearly: yearlyGoal };
      return () => clearTimeout(timer);
    }
    
    prevGoals.current = { weekly: weeklyGoal, monthly: monthlyGoal, yearly: yearlyGoal };
  }, [weeklyGoal, monthlyGoal, yearlyGoal]);

  const currentWeeklyTotal = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const weekResisted = resistedAttempts.filter(h => isWithinInterval(new Date(h.timestamp), { start, end }));
    return weekResisted.length * 15;
  }, [resistedAttempts, now]);

  const currentMonthlyTotal = useMemo(() => {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthResisted = resistedAttempts.filter(h => isWithinInterval(new Date(h.timestamp), { start, end }));
    return monthResisted.length * 15;
  }, [resistedAttempts, now]);

  const currentYearlyTotal = useMemo(() => {
    const start = startOfYear(now);
    const end = endOfMonth(setMonth(start, 11));
    const yearResisted = resistedAttempts.filter(h => isWithinInterval(new Date(h.timestamp), { start, end }));
    return yearResisted.length * 15;
  }, [resistedAttempts, now]);

  const GoalRing = ({ 
    total, 
    goal, 
    period, 
    size = 120, 
    strokeWidth = 8, 
    isIncreasing = false,
  }: { 
    total: number, 
    goal: number, 
    period: string, 
    size?: number, 
    strokeWidth?: number,
    isIncreasing?: boolean,
  }) => {
    const percentage = Math.min((total / goal) * 100, 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Dynamic font scaling based on ring size
    const scale = size / 120;
    const periodSize = Math.max(14, 16 * scale);
    const percentageSize = Math.max(8, 9 * scale);
    const timeSize = Math.max(7, 8 * scale);
    const goalSize = Math.max(6, 7 * scale);

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f0f0f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isIncreasing ? "#ef4444" : "#5A5A40"}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ 
                strokeDashoffset: offset,
                stroke: isIncreasing ? "#ef4444" : "#5A5A40"
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            <span 
              className="font-bold leading-tight whitespace-nowrap text-aura-ink"
              style={{ fontSize: `${periodSize}px` }}
            >
              {period}
            </span>
            <span 
              className="font-medium leading-tight whitespace-nowrap text-aura-ink/60"
              style={{ fontSize: `${percentageSize}px` }}
            >
              {percentage.toFixed(0)}%
            </span>
            <span 
              className="text-aura-sage font-medium leading-tight whitespace-nowrap"
              style={{ fontSize: `${timeSize}px` }}
            >
              {formatTime(total)}
            </span>
            <span 
              className="text-aura-ink/30 leading-tight whitespace-nowrap flex items-center gap-1"
              style={{ fontSize: `${goalSize}px` }}
            >
              {formatTime(goal)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const allYearlyData = useMemo(() => {
    return availableYears.map(year => {
      const yearResisted = resistedAttempts.filter(h => new Date(h.timestamp).getFullYear() === year);
      const total = yearResisted.length * 15;
      const percentage = Math.min((total / yearlyGoal) * 100, 100);
      return {
        year,
        total,
        percentage,
        pieData: [
          { name: 'Saved', value: total },
          { name: 'Remaining', value: Math.max(yearlyGoal - total, 0) }
        ]
      };
    });
  }, [resistedAttempts, availableYears, yearlyGoal]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-aura-sage/10 shadow-xl rounded-2xl text-xs">
          <p className="font-bold text-aura-ink/40 uppercase tracking-widest mb-1">{payload[0].payload.fullDate || label}</p>
          <p className="text-aura-sage font-medium text-sm">{formatTime(payload[0].value)} saved</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-4xl serif italic">Progress</h1>
        
        <div className="p-8 bg-aura-sage text-white rounded-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-white/60 uppercase tracking-widest text-[10px] font-bold">
              <Clock size={14} />
              Total Time Saved
            </div>
            <div className="text-5xl font-light">
              {formatTime(totalMinutesSaved)}
            </div>
            <p className="text-sm text-white/70 italic">
              A testament to your conscious choices.
            </p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex p-1 bg-aura-sage/5 rounded-2xl">
          {(['weekly', 'monthly', 'yearly'] as ViewType[]).map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                view === t 
                  ? 'bg-white text-aura-sage shadow-sm' 
                  : 'text-aura-ink/40 hover:text-aura-ink/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sub-navigation for Year Selection */}
        <AnimatePresence mode="wait">
          {(view === 'monthly' || view === 'yearly') && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
              {availableYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedYear === y
                      ? 'bg-aura-sage text-white shadow-sm'
                      : 'bg-aura-sage/5 text-aura-ink/40 hover:bg-aura-sage/10'
                  }`}
                >
                  {y}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px] flex flex-col">
        <AnimatePresence mode="wait">
          {resistedAttempts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4"
            >
              <div className="w-16 h-16 bg-aura-sage/5 rounded-full flex items-center justify-center text-aura-sage/20">
                <TrendingUp size={32} />
              </div>
              <p className="text-aura-ink/40 italic">No progress recorded yet.</p>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-6 rounded-[2.5rem] border border-aura-sage/5 shadow-sm"
            >
              {view === 'weekly' && (
                <div className="space-y-8">
                  <div className="flex justify-center py-4">
                    <GoalRing 
                      total={currentWeeklyTotal} 
                      goal={weeklyGoal} 
                      period={`Week ${getWeek(now)}`} 
                      size={140} 
                      strokeWidth={10} 
                      isIncreasing={increasedGoals.weekly}
                    />
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                      <Bar 
                        dataKey="minutes" 
                        fill="#5A5A40" 
                        radius={[6, 6, 0, 0]} 
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

              {view === 'monthly' && (
                <div className="space-y-12">
                  <div className="px-2 text-center">
                    <h3 className="text-sm serif italic text-aura-sage">
                      Monthly Breakdown for {selectedYear}
                    </h3>
                  </div>
                  
                  {allMonthlyData.map((month) => {
                    const monthTotal = month.data.reduce((acc, curr) => acc + curr.minutes, 0);
                    return (
                      <div key={month.monthName} className="space-y-6 border-b border-aura-sage/5 pb-8 last:border-0">
                        <div className="flex flex-col items-center gap-4">
                          <GoalRing 
                            total={monthTotal} 
                            goal={monthlyGoal} 
                            period={month.monthName} 
                            size={120} 
                            strokeWidth={8} 
                            isIncreasing={increasedGoals.monthly && month.monthName === format(now, 'MMMM')}
                          />
                        </div>
                        <div className="h-[140px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={month.data} margin={{ top: 5, right: 5, left: -35, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 6, fill: '#9ca3af', angle: -45, textAnchor: 'end' }}
                                interval={0}
                                height={40}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 8, fill: '#9ca3af' }}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                              <Bar 
                                dataKey="minutes" 
                                fill="#5A5A40" 
                                radius={[2, 2, 0, 0]} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {view === 'yearly' && (
                <div className="space-y-6">
                  <div className="px-2 space-y-6">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-aura-sage/40 text-center">
                      Annual Goals Review
                    </h3>
                    
                    <div className="relative h-[400px] w-full flex items-center justify-center">
                      {/* Yearly Ring (Largest, Center Bottom) */}
                      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
                        <GoalRing 
                          total={selectedYear === now.getFullYear() ? currentYearlyTotal : (allYearlyData.find(y => y.year === selectedYear)?.total || 0)} 
                          goal={yearlyGoal} 
                          period={`${selectedYear}`} 
                          size={200} 
                          strokeWidth={10} 
                          isIncreasing={increasedGoals.yearly}
                        />
                      </div>
                      
                      {/* Monthly Ring (Medium, Middle Tier) */}
                      <div 
                        className="absolute left-1/2" 
                        style={{ bottom: '205px', transform: 'translateX(calc(-50% + 70px))' }}
                      >
                        <GoalRing 
                          total={currentMonthlyTotal} 
                          goal={monthlyGoal} 
                          period={format(now, 'MMMM')} 
                          size={140} 
                          strokeWidth={8} 
                          isIncreasing={increasedGoals.monthly}
                        />
                      </div>
                      
                      {/* Weekly Ring (Smallest, Top Tier) */}
                      <div 
                        className="absolute left-1/2" 
                        style={{ bottom: '315px', transform: 'translateX(calc(-50% - 10px))' }}
                      >
                        <GoalRing 
                          total={currentWeeklyTotal} 
                          goal={weeklyGoal} 
                          period={`Week ${getWeek(now)}`} 
                          size={100} 
                          strokeWidth={6} 
                          isIncreasing={increasedGoals.weekly}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-2">
                    {allYearlyData.filter(y => y.year === selectedYear).map((yearData) => {
                      const displayTotal = yearData.total;
                      const displayPercentage = Math.min((displayTotal / yearlyGoal) * 100, 100);
                      
                      return (
                        <div key={yearData.year} className="p-4 bg-aura-sage/5 rounded-2xl space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-aura-ink/40">
                            <span>{yearData.year} Progress</span>
                            <span>{formatTime(displayTotal)} / {formatTime(yearlyGoal)}</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${displayPercentage}%` }}
                              className="h-full bg-aura-sage"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Yearly Progress History (Other Years) */}
                  {availableYears.length > 1 && (
                    <>
                      <div className="px-2 pt-8 border-t border-aura-sage/10">
                        <h3 className="text-sm serif italic text-aura-sage">
                          Other Years
                        </h3>
                      </div>
                      {allYearlyData.filter(y => y.year !== selectedYear).map((yearData) => (
                        <div key={yearData.year} className="px-2">
                          <div className="p-4 bg-aura-sage/5 rounded-2xl space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-aura-ink/40">
                              <span>{yearData.year} Progress</span>
                              <span>{formatTime(yearData.total)} / {formatTime(yearlyGoal)}</span>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${yearData.percentage}%` }}
                                className="h-full bg-aura-sage"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Insights Card */}
      {resistedAttempts.length > 0 && (
        <div className="p-6 bg-aura-cream border border-aura-sage/10 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-aura-sage">
            <TrendingUp size={18} />
            <h3 className="font-medium">Mindfulness Insight</h3>
          </div>
          <p className="text-sm text-aura-ink/60 leading-relaxed italic">
            {view === 'weekly' && "Your focus peaks on days when you start with a clear intention. Keep it up!"}
            {view === 'monthly' && "Consistency is building your mental resilience. Every bar represents a moment of self-control."}
            {view === 'yearly' && "Look at the cumulative impact of your choices. You are reclaiming your life, minute by minute."}
          </p>
        </div>
      )}
    </div>
  );
};
