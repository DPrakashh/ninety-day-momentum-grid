
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Users, Moon, Sun } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';
import TodoList from './TodoList';
import HeatmapTracker from './HeatmapTracker';
import TodayStats from './TodayStats';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchStats();
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setDarkMode(shouldUseDark);
    updateTheme(shouldUseDark);
  }, []);

  const fetchStats = async () => {
    const { data } = await supabase
      .from('site_stats')
      .select('stat_value')
      .eq('stat_name', 'total_users')
      .single();
    
    if (data) {
      setTotalUsers(data.stat_value);
    }
  };

  const updateTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    updateTheme(newDarkMode);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back! 🚀
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Let's make today productive
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="p-2"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pomodoro Timer */}
          <div className="lg:col-span-2">
            <PomodoroTimer />
          </div>

          {/* Today's Stats */}
          <div className="lg:col-span-1">
            <TodayStats />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Todo List */}
          <div className="lg:col-span-1">
            <TodoList />
          </div>

          {/* Placeholder for future feature or move heatmap here */}
          <div className="lg:col-span-1">
            {/* This space could be used for weekly stats or other features */}
          </div>
        </div>

        {/* Heatmap - Full Width */}
        <div className="mb-6">
          <HeatmapTracker />
        </div>

        {/* Stats Footer */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{totalUsers} users have joined the challenge</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
