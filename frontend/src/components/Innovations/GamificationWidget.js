// Gamification Widget - Achievements, progress, and rewards display
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../../hooks/useGamification';

const GamificationWidget = () => {
  const { currentLevel, getAllAchievements, unlockeds, updateStats } = useGamification();
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const achievements = getAllAchievements();
  const recentAchievements = achievements.filter(a => a.unlocked).slice(-4);

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(() => {
      updateStats({});
    }, 60000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const levelProgress = currentLevel().nextLevel ? 
    ((currentLevel().totalPoints - currentLevel().minPoints) / 
    (currentLevel().nextLevel.minPoints - currentLevel().minPoints)) * 100 : 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      {/* Level Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] p-4 text-white mb-4">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl"
            >
              🏆
            </motion.div>
            <div>
              <p className="text-white/80 text-xs">Current Level</p>
              <p className="text-2xl font-bold">{currentLevel().title}</p>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Level {currentLevel().level}</span>
              <span>{currentLevel().nextLevel ? `Level ${currentLevel().nextLevel.level}` : 'Max Level!'}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-xs text-white/80 mt-1">
              {currentLevel().totalPoints} XP • 
              {currentLevel().nextLevel && ` ${currentLevel().nextLevel.pointsNeeded} XP to next level`}
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
      </div>

      {/* Recent Achievements */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-[#2D3748] flex items-center gap-2">
            <span>🏅</span> Achievements
          </h4>
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="text-xs text-[#FF6B6B] hover:underline"
          >
            {showAchievements ? 'Show less' : 'View all'}
          </button>
        </div>

        <div className="flex gap-2">
          {recentAchievements.map((achievement) => (
            <motion.button
              key={achievement.id}
              whileHover={{ scale: 1.1, y: -2 }}
              onClick={() => setSelectedAchievement(achievement)}
              className="relative group"
              title={achievement.name}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center text-2xl shadow-md">
                {achievement.icon}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
              >
                <span className="text-white text-[8px]">✓</span>
              </motion.div>
            </motion.button>
          ))}
          
          {/* Locked slots */}
          {[...Array(Math.max(0, 4 - recentAchievements.length))].map((_, i) => (
            <div
              key={`locked-${i}`}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"
            >
              🔒
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-lg font-bold text-[#2D3748]">{achievements.filter(a => a.unlocked).length}</p>
          <p className="text-xs text-gray-500">Unlocked</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-lg font-bold text-[#2D3748]">{achievements.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl mb-4"
                >
                  {selectedAchievement.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">
                  {selectedAchievement.name}
                </h3>
                <p className="text-gray-500 mb-4">{selectedAchievement.description}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white px-3 py-1 rounded-full text-sm font-bold">
                    +{selectedAchievement.points} XP
                  </span>
                  {selectedAchievement.unlocked && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      ✅ Unlocked
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamificationWidget;
