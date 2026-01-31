// AI-Powered Lead Scoring Hook
// Uses ML-like algorithm to score leads based on multiple factors

import { useMemo } from 'react';

export const useLeadScoring = (lead) => {
  const score = useMemo(() => {
    if (!lead) return 0;

    let totalScore = 0;
    const factors = [];

    // Email score (valid email format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(lead.email)) {
      totalScore += 15;
      factors.push({ name: 'Valid Email', points: 15, icon: '📧' });
    } else {
      factors.push({ name: 'Invalid Email', points: 0, icon: '❌' });
    }

    // Phone score (presence)
    if (lead.phone && lead.phone.length >= 10) {
      totalScore += 10;
      factors.push({ name: 'Phone Provided', points: 10, icon: '📞' });
    } else {
      factors.push({ name: 'No Phone', points: 0, icon: '📞' });
    }

    // Source scoring
    const sourceScores = {
      referral: 25,
      website: 15,
      ads: 10,
      social: 12,
    };
    const sourceScore = sourceScores[lead.source] || 5;
    totalScore += sourceScore;
    factors.push({ name: `${lead.source} Source`, points: sourceScore, icon: '🎯' });

    // Status scoring
    const statusScores = {
      qualified: 30,
      contacted: 20,
      new: 10,
      lost: -10,
    };
    const statusScore = statusScores[lead.status] || 0;
    totalScore += statusScore;
    factors.push({ name: `${lead.status} Status`, points: statusScore, icon: '📊' });

    // Recency bonus (newer leads get slight boost)
    const daysSinceCreation = lead.date ? 
      Math.floor((Date.now() - lead.id) / (1000 * 60 * 60 * 24)) : 0;
    if (daysSinceCreation < 7) {
      totalScore += 10;
      factors.push({ name: 'Recent Lead', points: 10, icon: '🆕' });
    }

    // Name completeness
    if (lead.name && lead.name.split(' ').length >= 2) {
      totalScore += 10;
      factors.push({ name: 'Full Name', points: 10, icon: '👤' });
    }

    // Cap score between 0-100
    totalScore = Math.max(0, Math.min(100, totalScore));

    return {
      score: totalScore,
      factors,
      grade: getGrade(totalScore),
      prediction: getPrediction(totalScore, lead),
      recommendedAction: getRecommendedAction(totalScore, lead.status),
    };
  }, [lead]);

  return score;
};

const getGrade = (score) => {
  if (score >= 80) return { label: 'Hot', color: '#FF6B6B', bg: 'bg-red-100' };
  if (score >= 60) return { label: 'Warm', color: '#F59E0B', bg: 'bg-yellow-100' };
  if (score >= 40) return { label: 'Cool', color: '#3B82F6', bg: 'bg-blue-100' };
  return { label: 'Cold', color: '#6B7280', bg: 'bg-gray-100' };
};

const getPrediction = (score, status) => {
  if (score >= 80 && status !== 'lost') {
    return 'High conversion probability. Prioritize follow-up.';
  }
  if (score >= 60 && status !== 'lost') {
    return 'Good potential. Regular nurturing recommended.';
  }
  if (score >= 40) {
    return 'Moderate interest. Consider engagement campaigns.';
  }
  return 'Low engagement. May need re-evaluation or reactivation.';
};

const getRecommendedAction = (score, status) => {
  if (status === 'lost') {
    return 'Reactivation campaign needed';
  }
  if (score >= 80) {
    return 'Schedule demo call immediately';
  }
  if (score >= 60) {
    return 'Send personalized follow-up';
  }
  if (score >= 40) {
    return 'Add to nurturing sequence';
  }
  return 'Research and re-engage';
};
