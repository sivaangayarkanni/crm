// AI Score Badge - Visual lead scoring indicator
import React from 'react';
import { motion } from 'framer-motion';

const AIScoreBadge = ({ score, size = 'md', showDetails = false }) => {
  const { grade, prediction, recommendedAction } = score;
  
  const sizes = {
    sm: { badge: 'w-8 h-8 text-xs', icon: 'text-xs' },
    md: { badge: 'w-12 h-12 text-sm', icon: 'text-base' },
    lg: { badge: 'w-16 h-16 text-lg', icon: 'text-xl' },
  };

  const pulseAnimation = grade.label === 'Hot' ? {
    scale: [1, 1.1, 1],
    boxShadow: ['0 0 0 0 rgba(255, 107, 107, 0.4)', '0 0 0 10px rgba(255, 107, 107, 0)', '0 0 0 0 rgba(255, 107, 107, 0)'],
  } : {};

  return (
    <div className="relative inline-flex flex-col items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, ...pulseAnimation }}
        className={`${sizes[size].badge} rounded-full flex items-center justify-center font-bold ${grade.bg}`}
        style={{ color: grade.color }}
        transition={{ repeat: grade.label === 'Hot' ? Infinity : 0, duration: 2 }}
      >
        <span className={sizes[size].icon}>{score.score}</span>
      </motion.div>
      
      {size !== 'sm' && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full bg-white shadow text-[#2D3748] font-semibold"
        >
          {grade.label}
        </motion.span>
      )}

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white rounded-xl shadow-xl p-3 z-50"
        >
          <div className="text-xs font-semibold text-[#2D3748] mb-2">AI Prediction</div>
          <p className="text-xs text-gray-600 mb-2">{prediction}</p>
          <div className="flex items-center gap-1 text-xs text-[#FF6B6B]">
            <span>💡</span>
            <span>{recommendedAction}</span>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-[#2D3748] mb-1">Score Factors</div>
            <div className="flex flex-wrap gap-1">
              {score.factors.filter(f => f.points > 0).slice(0, 3).map((factor, i) => (
                <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {factor.icon} +{factor.points}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIScoreBadge;
