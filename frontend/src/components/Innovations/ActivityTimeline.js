// Activity Timeline - Visual interaction history
import React from 'react';
import { motion } from 'framer-motion';

const ActivityTimeline = ({ activities = [], maxItems = 10 }) => {
  const getActivityIcon = (type) => {
    const icons = {
      lead: '👥',
      contact: '📞',
      deal: '💼',
      email: '📧',
      call: '📱',
      meeting: '🤝',
      note: '📝',
      status: '🔄',
      revenue: '💰',
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (type) => {
    const colors = {
      lead: '#FF6B6B',
      contact: '#4ECDC4',
      deal: '#45B7D1',
      email: '#FFE66D',
      call: '#95E1D3',
      meeting: '#F38181',
      note: '#AA96DA',
      status: '#FCBAD3',
      revenue: '#FF6B6B',
    };
    return colors[type] || '#6B7280';
  };

  const formatTime = (time) => {
    if (!time) return 'Just now';
    if (time.includes('minute') || time.includes('hour') || time.includes('day')) return time;
    return time;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[#2D3748] flex items-center gap-2">
          <span className="text-lg">📊</span>
          Activity Timeline
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {activities.length} activities
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]" />

        <div className="space-y-3">
          {activities.slice(0, maxItems).map((activity, index) => (
            <motion.div
              key={activity.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-3 items-start group"
            >
              {/* Icon badge */}
              <div
                className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: getActivityColor(activity.type) + '20' }}
              >
                <span>{getActivityIcon(activity.type)}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-[#2D3748] text-sm truncate">
                    {activity.message}
                  </span>
                  {activity.scoreChange && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      activity.scoreChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {activity.scoreChange > 0 ? '+' : ''}{activity.scoreChange}
                    </span>
                  )}
                </div>
                
                {activity.user && (
                  <p className="text-xs text-gray-500">
                    by <span className="font-medium">{activity.user}</span>
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{formatTime(activity.time)}</span>
                  
                  {activity.metadata && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      {activity.metadata.value && (
                    <span className="text-xs text-gray-400">💰 {activity.metadata.value}</span>
                  )}
                      {activity.metadata.stage && <span>📍 {activity.metadata.stage}</span>}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {activities.length > maxItems && (
          <div className="relative flex gap-3 items-start mt-3 pt-3 border-t border-dashed border-gray-200">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100 text-gray-400">
              •••
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm text-gray-500">
                +{activities.length - maxItems} more activities
              </span>
            </div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">📭</span>
            <p className="text-gray-500 text-sm">No activities yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
