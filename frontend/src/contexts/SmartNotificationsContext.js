// Smart Notifications Context
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

const SmartNotificationsContext = createContext(null);

// Notification types
export const NOTIFICATION_TYPES = {
  LEAD_SCORE_CHANGE: 'lead_score_change',
  DEAL_STAGE_CHANGE: 'deal_stage_change',
  TASK_REMINDER: 'task_reminder',
  MENTION: 'mention',
  DEADLINE_APPROACHING: 'deadline_approaching',
  ANALYTICS_ALERT: 'analytics_alert',
  SYSTEM: 'system',
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const SmartNotificationsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { currentTenant } = useTenant();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    quietHours: { start: '22:00', end: '08:00' },
    categories: {
      leads: true,
      deals: true,
      tasks: true,
      mentions: true,
      analytics: true,
      system: true,
    },
  });

  // Generate smart notification based on context
  const generateSmartNotification = useCallback((eventData) => {
    const { type, data, priority = PRIORITY_LEVELS.MEDIUM } = eventData;
    
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      timestamp: new Date().toISOString(),
      read: false,
      data,
      // Smart suggestions based on notification type
      suggestions: getSmartSuggestions(type, data),
    };

    return notification;
  }, []);

  const getSmartSuggestions = (type, data) => {
    const suggestions = {
      lead_score_change: [
        { label: 'View Lead Details', action: 'view_lead', params: { id: data.leadId } },
        { label: 'Schedule Follow-up', action: 'schedule', params: { id: data.leadId, type: 'follow_up' } },
        { label: 'Send Email', action: 'email', params: { id: data.leadId } },
      ],
      deal_stage_change: [
        { label: 'View Deal Pipeline', action: 'view_deal', params: { id: data.dealId } },
        { label: 'Add Task', action: 'add_task', params: { dealId: data.dealId } },
        { label: 'Update Forecast', action: 'update_forecast', params: { dealId: data.dealId } },
      ],
      task_reminder: [
        { label: 'Complete Task', action: 'complete_task', params: { taskId: data.taskId } },
        { label: 'Snooze 1 hour', action: 'snooze', params: { taskId: data.taskId, duration: 3600000 } },
        { label: 'Delegate', action: 'delegate', params: { taskId: data.taskId } },
      ],
      deadline_approaching: [
        { label: 'Mark as Priority', action: 'priority', params: { id: data.id, type: data.entityType } },
        { label: 'Extend Deadline', action: 'extend', params: { id: data.id, type: data.entityType } },
        { label: 'Assign to Team', action: 'assign', params: { id: data.id, type: data.entityType } },
      ],
      mention: [
        { label: 'Reply', action: 'reply', params: { mentionId: data.mentionId } },
        { label: 'View Context', action: 'view_context', params: { contextId: data.contextId } },
      ],
      analytics_alert: [
        { label: 'View Analytics', action: 'view_analytics', params: { metric: data.metric } },
        { label: 'Compare Periods', action: 'compare', params: { metric: data.metric } },
        { label: 'Export Report', action: 'export', params: { metric: data.metric } },
      ],
      system: [
        { label: 'Dismiss', action: 'dismiss', params: {} },
        { label: 'Learn More', action: 'learn_more', params: { topic: data.topic } },
      ],
    };

    return suggestions[type] || [];
  };

  const addNotification = useCallback((eventData) => {
    const notification = generateSmartNotification(eventData);
    
    setNotifications(prev => {
      // Keep only last 100 notifications
      const updated = [notification, ...prev].slice(0, 100);
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
    
    // Play sound if enabled and not in quiet hours
    if (settings.soundEnabled && !isInQuietHours()) {
      playNotificationSound();
    }
    
    return notification;
  }, [generateSmartNotification, settings.soundEnabled]);

  const isInQuietHours = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const { start, end } = settings.quietHours;
    
    if (start > end) {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
    return currentTime >= start && currentTime <= end;
  };

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Ignore errors if audio can't play
  };

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const executeAction = useCallback((notificationId, action, params) => {
    // Handle action execution
    console.log(`Executing action: ${action} with params:`, params);
    
    // Mark notification as read after action
    markAsRead(notificationId);
    
    // Return action details for parent component to handle
    return { action, params };
  }, [markAsRead]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Filter notifications based on settings
  const filteredNotifications = notifications.filter(n => {
    const category = getCategoryFromType(n.type);
    return settings.categories[category] !== false;
  });

  const getCategoryFromType = (type) => {
    const categoryMap = {
      [NOTIFICATION_TYPES.LEAD_SCORE_CHANGE]: 'leads',
      [NOTIFICATION_TYPES.DEAL_STAGE_CHANGE]: 'deals',
      [NOTIFICATION_TYPES.TASK_REMINDER]: 'tasks',
      [NOTIFICATION_TYPES.MENTION]: 'mentions',
      [NOTIFICATION_TYPES.DEADLINE_APPROACHING]: 'tasks',
      [NOTIFICATION_TYPES.ANALYTICS_ALERT]: 'analytics',
      [NOTIFICATION_TYPES.SYSTEM]: 'system',
    };
    return categoryMap[type] || 'system';
  };

  // Group notifications by date
  const groupedNotifications = groupByDate(filteredNotifications);

  const groupByDate = (notifications) => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today - 86400000);
    const weekStart = new Date(today - (now.getDay() * 86400000));
    
    notifications.forEach(n => {
      const notifDate = new Date(n.timestamp);
      
      if (notifDate >= today) {
        groups.today.push(n);
      } else if (notifDate >= yesterday) {
        groups.yesterday.push(n);
      } else if (notifDate >= weekStart) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    });
    
    return groups;
  };

  // Auto-dismiss notifications after timeout for certain types
  useEffect(() => {
    const timers = notifications
      .filter(n => n.priority === PRIORITY_LEVELS.LOW && !n.read)
      .map(n => {
        return setTimeout(() => {
          deleteNotification(n.id);
        }, 30000); // Auto-dismiss after 30 seconds for low priority
      });
    
    return () => timers.forEach(clearTimeout);
  }, [notifications, deleteNotification]);

  const value = {
    notifications: filteredNotifications,
    groupedNotifications,
    unreadCount,
    isOpen,
    setIsOpen,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    executeAction,
    updateSettings,
    NOTIFICATION_TYPES,
    PRIORITY_LEVELS,
  };

  return (
    <SmartNotificationsContext.Provider value={value}>
      {children}
    </SmartNotificationsContext.Provider>
  );
};

export const useSmartNotifications = () => {
  const context = useContext(SmartNotificationsContext);
  if (!context) {
    throw new Error('useSmartNotifications must be used within a SmartNotificationsProvider');
  }
  return context;
};

export default SmartNotificationsContext;
