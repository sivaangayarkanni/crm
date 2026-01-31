import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AIScoreBadge from '../../components/Innovations/AIScoreBadge';
import VoiceCommandButton from '../../components/Innovations/VoiceCommandButton';
import ActivityTimeline from '../../components/Innovations/ActivityTimeline';
import GamificationWidget from '../../components/Innovations/GamificationWidget';
import SmartSearch from '../../components/Innovations/SmartSearch';
import DarkModeToggle from '../../components/Innovations/DarkModeToggle';
import { useLeadScoring } from '../../hooks/useLeadScoring';
import { useGamification } from '../../hooks/useGamification';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const { updateStats } = useGamification();

  useEffect(() => {
    const loadData = () => {
      const savedLeads = JSON.parse(localStorage.getItem('leads') || '[]');
      const savedContacts = JSON.parse(localStorage.getItem('contacts') || '[]');
      const savedDeals = JSON.parse(localStorage.getItem('deals') || '[]');
      setLeads(savedLeads);
      setContacts(savedContacts);
      setDeals(savedDeals);

      // Update gamification stats
      const revenue = savedDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
      updateStats({
        totalLeads: savedLeads.length,
        totalContacts: savedContacts.length,
        totalDeals: savedDeals.length,
        qualifiedLeads: savedLeads.filter(l => l.status === 'qualified').length,
        hotLeads: savedLeads.filter(l => {
          const lead = savedLeads.find(li => li.id === l.id);
          return lead && l.status !== 'lost';
        }).length,
        totalRevenue: revenue,
      });
    };
    loadData();
  }, [updateStats]);

  // Smart search data
  const searchData = [...leads, ...contacts, ...deals].map(item => ({
    ...item,
    name: item.name || item.title,
  }));

  // AI-scored hot leads
  const hotLeads = leads
    .slice()
    .sort((a, b) => {
      const scoreA = useLeadScoring(a).score || 0;
      const scoreB = useLeadScoring(b).score || 0;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  const stats = [
    {
      name: 'Total Leads',
      value: leads.length,
      change: '+12%',
      changeType: 'increase',
      icon: '👥',
      color: 'from-[#FF6B6B] to-[#4ECDC4]'
    },
    {
      name: 'Active Contacts',
      value: contacts.length,
      change: '+8%',
      changeType: 'increase',
      icon: '📞',
      color: 'from-[#4ECDC4] to-[#45B7D1]'
    },
    {
      name: 'Open Deals',
      value: deals.length,
      change: '-2%',
      changeType: 'decrease',
      icon: '💼',
      color: 'from-[#45B7D1] to-[#FFE66D]'
    },
    {
      name: 'Revenue',
      value: `$${deals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0)}`,
      change: '+15%',
      changeType: 'increase',
      icon: '💰',
      color: 'from-[#FFE66D] to-[#FF6B6B]'
    }
  ];

  const recentActivities = [
    { id: 1, message: 'New lead added from website', time: '2 minutes ago', type: 'lead' },
    { id: 2, message: 'Deal moved to negotiation', time: '1 hour ago', type: 'deal' },
    { id: 3, message: 'Contact profile updated', time: '3 hours ago', type: 'contact' },
    { id: 4, message: 'Deal closed successfully', time: '5 hours ago', type: 'revenue' }
  ];

  const quickActions = [
    { name: 'Add Lead', icon: '👥', color: 'bg-[#FF6B6B]', action: () => toast.success('Opening lead form...') },
    { name: 'New Contact', icon: '📞', color: 'bg-[#4ECDC4]', action: () => toast.success('Opening contact form...') },
    { name: 'Create Deal', icon: '💼', color: 'bg-[#45B7D1]', action: () => toast.success('Opening deal form...') },
    { name: 'View Analytics', icon: '📊', color: 'bg-[#FFE66D]', action: () => window.location.href = '/app/analytics' }
  ];

  return (
    <div className="space-y-6" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
      {/* Welcome Section with Innovations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl shadow-lg p-6 text-white relative overflow-hidden bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4]"
      >
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
              Welcome back, {user.username}! 👋
            </h1>
            <p className="text-white/90 text-lg">
              Here's what's happening in your CRM today.
            </p>
          </div>
          
          {/* Innovation Controls */}
          <div className="flex items-center gap-3">
            <SmartSearch 
              data={searchData} 
              searchFields={['name', 'email', 'title', 'company']}
              placeholder="Search anything..."
              className="w-64"
            />
            <DarkModeToggle size="md" />
            <VoiceCommandButton />
          </div>
        </div>
        
        {/* Animated Background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
          <span className="text-8xl">⚡</span>
        </div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 opacity-10">
          <span className="text-6xl">🚀</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-lg mr-1">
                {stat.changeType === 'increase' ? '📈' : '📉'}
              </span>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1 dark:text-gray-400">from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insights & Gamification Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI-Powered Hot Leads */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xl mr-2">🤖</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Poppins, sans-serif'}}>
                  AI-Powered Hot Leads
                </h3>
              </div>
              <span className="text-xs bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white px-3 py-1 rounded-full">
                ML Scored
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {hotLeads.length > 0 ? (
              <div className="space-y-4">
                {hotLeads.map((lead) => {
                  const scoring = useLeadScoring(lead);
                  return (
                    <div key={lead.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <AIScoreBadge score={scoring} size="md" showDetails />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{lead.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lead.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                            lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {lead.status}
                          </span>
                          <span className="text-xs text-gray-400">{lead.source}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success(`Contacting ${lead.name}...`)}
                        className="px-3 py-1.5 bg-[#FF6B6B] text-white text-sm rounded-lg hover:bg-[#FF6B6B]/80 transition-colors"
                      >
                        Contact
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">📊</span>
                <p className="text-gray-500 dark:text-gray-400">No leads to score yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Add leads to see AI predictions</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Gamification Widget */}
        <GamificationWidget />
      </div>

      {/* Activity Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <ActivityTimeline activities={recentActivities} maxItems={5} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <span className="text-xl mr-2">🎯</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Poppins, sans-serif'}}>
                Quick Actions
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <motion.button
                  key={action.name}
                  onClick={action.action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-[#FF6B6B] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                >
                  <div className={`p-3 rounded-xl ${action.color} mb-2 group-hover:scale-110 transition-transform`}>
                    <span className="text-xl text-white">{action.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Voice Commands Hint */}
            <div className="mt-6 p-4 bg-gradient-to-r from-[#FF6B6B]/10 to-[#4ECDC4]/10 rounded-xl">
              <p className="text-sm font-medium text-[#2D3748] dark:text-white mb-2">
                🎙️ Try Voice Commands!
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Say "Go to leads", "Add lead", or "Dark mode" for hands-free control
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Innovation Features Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-[#4ECDC4]/10 to-[#45B7D1]/10 dark:from-[#4ECDC4]/5 dark:to-[#45B7D1]/5 rounded-xl p-6 border border-[#4ECDC4]/20 dark:border-[#4ECDC4]/10"
      >
        <div className="flex items-center mb-4">
          <div className="p-2 bg-[#4ECDC4]/20 dark:bg-[#4ECDC4]/10 rounded-lg">
            <span className="text-xl">⚡</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3" style={{fontFamily: 'Poppins, sans-serif'}}>
            Innovation Features Active
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-2xl mb-1">🤖</div>
            <div className="text-sm font-bold text-[#4ECDC4]">AI Lead Scoring</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">ML-powered predictions</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-2xl mb-1">🎙️</div>
            <div className="text-sm font-bold text-[#4ECDC4]">Voice Commands</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Hands-free navigation</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-2xl mb-1">🎮</div>
            <div className="text-sm font-bold text-[#4ECDC4]">Gamification</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Achievements & rewards</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-2xl mb-1">🔍</div>
            <div className="text-sm font-bold text-[#4ECDC4]">Smart Search</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Fuzzy matching</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
