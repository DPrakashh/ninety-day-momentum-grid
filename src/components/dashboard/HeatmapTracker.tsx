
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DayProgress {
  date: string;
  completion_percentage: number;
}

const HeatmapTracker = () => {
  const [progressData, setProgressData] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 89); // 90 days total

      const { data, error } = await supabase
        .from('daily_progress')
        .select('date, completion_percentage')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDays = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 89);

    for (let i = 0; i < 90; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const progressDay = progressData.find(d => d.date === dateString);
      const percentage = progressDay?.completion_percentage || 0;
      
      days.push({
        date: dateString,
        percentage,
        isToday: dateString === today.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const getIntensityClass = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (percentage <= 25) return 'bg-green-100 dark:bg-green-900';
    if (percentage <= 50) return 'bg-green-200 dark:bg-green-800';
    if (percentage <= 75) return 'bg-green-300 dark:bg-green-700';
    return 'bg-green-400 dark:bg-green-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const days = generateDays();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔥 90-Day Progress Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading progress...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔥 90-Day Progress Heatmap</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your daily task completion over the last 90 days
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-18 lg:grid-cols-30 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`
                w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110
                ${getIntensityClass(day.percentage)}
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
              `}
              title={`${formatDate(day.date)} - ${day.percentage}% completed`}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600"></div>
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapTracker;
