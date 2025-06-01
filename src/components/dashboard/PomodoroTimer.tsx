
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PomodoroTimer = () => {
  const [duration, setDuration] = useState([25]);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [category, setCategory] = useState('study');
  const [todayTotal, setTodayTotal] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setTimeLeft(duration[0] * 60);
  }, [duration]);

  useEffect(() => {
    if (user) {
      fetchTodayTotal();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsPaused(false);
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

  const fetchTodayTotal = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration_minutes, category')
      .eq('user_id', user.id)
      .eq('date', today);

    if (!error && data) {
      const total = data.reduce((sum, session) => sum + session.duration_minutes, 0);
      setTodayTotal(total);
    }
  };

  const handleSessionComplete = async () => {
    if (!user) return;

    const completedMinutes = duration[0];
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        duration_minutes: completedMinutes,
        category: category,
        date: today
      });

    if (!error) {
      setTodayTotal(prev => prev + completedMinutes);
      toast({
        title: "Session Complete! 🎉",
        description: `Great job! You completed ${completedMinutes} minutes of ${category}.`,
      });
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(duration[0] * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration[0] * 60 - timeLeft) / (duration[0] * 60)) * 100;

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'study': return '📚';
      case 'skills': return '💡';
      case 'health': return '💪';
      default: return '⏱️';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">⏱️ Focus Timer</CardTitle>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Focusing for {duration[0]} minutes on {getCategoryEmoji(category)} {category}
        </p>
        <div className="text-center text-sm font-medium text-blue-600 dark:text-blue-400">
          Today's Total: {todayTotal} minutes
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="text-blue-500 transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isActive ? (isPaused ? 'Paused' : 'Focusing') : 'Ready'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Duration: {duration[0]} minutes
            </label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={60}
              min={25}
              step={5}
              disabled={isActive}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory} disabled={isActive}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study">📚 Study</SelectItem>
                <SelectItem value="skills">💡 Skills</SelectItem>
                <SelectItem value="health">💪 Health</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={isActive ? handlePause : handleStart}
              variant={isActive ? "secondary" : "default"}
              size="lg"
            >
              {isActive ? (
                isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isActive ? (isPaused ? 'Resume' : 'Pause') : 'Start'}
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
