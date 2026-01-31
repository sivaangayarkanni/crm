// Gamification System - Achievements, progress tracking, and rewards
import { useState, useEffect, useCallback } from 'react';

const ACHIEVEMENTS = {
  first_lead: {
    id: 'first_lead',
    name: 'First Steps',
    description: 'Add your first lead',
    icon: '🎯',
    points: 10,
    condition: (stats) => stats.totalLeads >= 1,
  },
  five_leads: {
    id: 'five_leads',
    name: 'Lead Generator',
    description: 'Add 5 leads',
    icon: '👥',
    points: 25,
    condition: (stats) => stats.totalLeads >= 5,
  },
  ten_leads: {
    id: 'ten_leads',
    name: 'Lead Machine',
    description: 'Add 10 leads',
    icon: '🚀',
    points: 50,
    condition: (stats) => stats.totalLeads >= 10,
  },
  first_deal: {
    id: 'first_deal',
    name: 'Deal Maker',
    description: 'Create your first deal',
    icon: '💼',
    points: 15,
    condition: (stats) => stats.totalDeals >= 1,
  },
  five_deals: {
    id: 'five_deals',
    name: 'Deal Closer',
    description: 'Create 5 deals',
    icon: '🏆',
    points: 40,
    condition: (stats) => stats.totalDeals >= 5,
  },
  first_contact: {
    id: 'first_contact',
    name: 'Networker',
    description: 'Add your first contact',
    icon: '📞',
    points: 10,
    condition: (stats) => stats.totalContacts >= 1,
  },
  qualified_lead: {
    id: 'qualified_lead',
    name: 'Eye for Talent',
    description: 'Qualify a lead',
    icon: '⭐',
    points: 20,
    condition: (stats) => stats.qualifiedLeads >= 1,
  },
  hot_lead: {
    id: 'hot_lead',
    name: 'Hot Shot',
    description: 'Get a hot lead (score 80+)',
    icon: '🔥',
    points: 30,
    condition: (stats) => stats.hotLeads >= 1,
  },
  revenue_1000: {
    id: 'revenue_1000',
    name: 'Money Maker',
    description: 'Reach $1,000 in deal value',
    icon: '💰',
    points: 50,
    condition: (stats) => stats.totalRevenue >= 1000,
  },
  revenue_10000: {
    id: 'revenue_10000',
    name: 'Big Earner',
    description: 'Reach $10,000 in deal value',
    icon: '💎',
    points: 100,
    condition: (stats) => stats.totalRevenue >= 10000,
  },
  streak_7: {
    id: 'streak_7',
    name: 'Consistent Performer',
    description: '7-day activity streak',
    icon: '🔥',
    points: 70,
    condition: (stats) => stats.streakDays >= 7,
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log in before 8 AM',
    icon: '🌅',
    points: 15,
    condition: () => new Date().getHours() < 8,
  },
};

const LEVELS = [
  { level: 1, minPoints: 0, title: 'Rookie' },
  { level: 2, minPoints: 50, title: 'Apprentice' },
  { level: 3, minPoints: 150, title: 'Salesperson' },
  { level: 4, minPoints: 300, title: 'Account Executive' },
  { level: 5, minPoints: 500, title: 'Top Performer' },
  { level: 6, minPoints: 800, title: 'Sales Champion' },
  { level: 7, minPoints: 1200, title: 'Revenue Hero' },
  { level: 8, minPoints: 1800, title: 'CRM Master' },
  { level: 9, minPoints: 2500, title: 'Legend' },
  { level: 10, minPoints: 3500, title: 'Hall of Fame' },
];

export const useGamification = () => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalDeals: 0,
    totalContacts: 0,
    qualifiedLeads: 0,
    hotLeads: 0,
    totalRevenue: 0,
    streakDays: 0,
    lastActiveDate: null,
  });

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('gamification');
    if (saved) {
      const data = JSON.parse(saved);
      setUnlockedAchievements(data.unlockedAchievements || []);
      setStats(data.stats || stats);
    }
  }, []);

  // Save data
  const saveData = useCallback((newStats, newAchievements) => {
    localStorage.setItem('gamification', JSON.stringify({
      stats: newStats,
      unlockedAchievements: newAchievements,
    }));
  }, []);

  // Calculate current level
  const currentLevel = useCallback(() => {
    const totalPoints = unlockedAchievements.reduce((sum, id) => {
      const achievement = ACHIEVEMENTS[id];
      return sum + (achievement?.points || 0);
    }, 0);

    let level = LEVELS[0];
    for (const lvl of LEVELS) {
      if (totalPoints >= lvl.minPoints) {
        level = lvl;
      }
    }
    return { ...level, totalPoints, nextLevel: getNextLevel(totalPoints) };
  }, [unlockedAchievements]);

  // Get next level info
  const getNextLevel = (points) => {
    for (const lvl of LEVELS) {
      if (points < lvl.minPoints) {
        return {
          ...lvl,
          pointsNeeded: lvl.minPoints - points,
          progress: Math.round((points - LEVELS[LEVELS.indexOf(lvl) - 1]?.minPoints || 0) / (lvl.minPoints - (LEVELS[LEVELS.indexOf(lvl) - 1]?.minPoints || 0)) * 100),
        };
      }
    }
    return null;
  };

  // Update stats and check for new achievements
  const updateStats = useCallback((updates) => {
    setStats(prev => {
      const newStats = { ...prev, ...updates, lastActiveDate: new Date().toDateString() };
      const newAchievements = [...unlockedAchievements];
      let newUnlocked = false;

      // Check for new achievements
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!newAchievements.includes(achievement.id) && achievement.condition(newStats)) {
          newAchievements.push(achievement.id);
          newUnlocked = true;
        }
      });

      if (newUnlocked) {
        setUnlockedAchievements(newAchievements);
      }

      saveData(newStats, newAchievements);
      return newStats;
    });
  }, [unlockedAchievements, saveData]);

  // Get all achievements with unlock status
  const getAllAchievements = useCallback(() => {
    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: unlockedAchievements.includes(achievement.id),
    }));
  }, [unlockedAchievements]);

  // Reset progress
  const resetProgress = useCallback(() => {
    setUnlockedAchievements([]);
    setStats({
      totalLeads: 0,
      totalDeals: 0,
      totalContacts: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      totalRevenue: 0,
      streakDays: 0,
      lastActiveDate: null,
    });
    localStorage.removeItem('gamification');
  }, []);

  return {
    stats,
    unlockedAchievements,
    currentLevel,
    updateStats,
    getAllAchievements,
    resetProgress,
    achievements: ACHIEVEMENTS,
    levels: LEVELS,
  };
};
