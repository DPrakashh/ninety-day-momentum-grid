
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  category: string;
  total_minutes: number;
}

const TodayStats = () => {
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTodayStats();
    }
  }, [user]);

  const fetchTodayStats = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('category, duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today);

    if (!error && data) {
      const categoryTotals = data.reduce((acc, session) => {
        const category = session.category;
        acc[category] = (acc[category] || 0) + session.duration_minutes;
        return acc;
      }, {} as Record<string, number>);

      const formattedData = Object.entries(categoryTotals).map(([category, total_minutes]) => ({
        category,
        total_minutes
      }));

      setSessionData(formattedData);
      setTotalMinutes(data.reduce((sum, session) => sum + session.duration_minutes, 0));
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'study': return '📚';
      case 'skills': return '💡';
      case 'health': return '💪';
      default: return '⏱️';
    }
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">📊 Today's Focus Time</CardTitle>
        <p className="text-center text-2xl font-bold text-blue-600 dark:text-blue-400">
          {formatHours(totalMinutes)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionData.length > 0 ? (
          sessionData.map((session) => (
            <div key={session.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {getCategoryEmoji(session.category)} {session.category.charAt(0).toUpperCase() + session.category.slice(1)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatHours(session.total_minutes)}
                </span>
              </div>
              <Progress 
                value={totalMinutes > 0 ? (session.total_minutes / totalMinutes) * 100 : 0} 
                className="h-2"
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No focus sessions today yet.</p>
            <p className="text-sm mt-1">Start your first session! 🚀</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayStats;
