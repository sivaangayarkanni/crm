import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { toast } from 'react-hot-toast';

const KanbanBoard = () => {
  const [deals, setDeals] = useState([]);
  const [columns] = useState([
    { id: 'lead', title: 'Lead', color: 'from-blue-400 to-blue-600' },
    { id: 'qualified', title: 'Qualified', color: 'from-yellow-400 to-orange-500' },
    { id: 'proposal', title: 'Proposal', color: 'from-purple-400 to-purple-600' },
    { id: 'negotiation', title: 'Negotiation', color: 'from-indigo-400 to-indigo-600' },
    { id: 'closed', title: 'Closed Won', color: 'from-green-400 to-green-600' }
  ]);

  useEffect(() => {
    const savedDeals = JSON.parse(localStorage.getItem('deals') || '[]');
    setDeals(savedDeals);
  }, []);

  const getDealsByStage = (stage) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const handleDragEnd = (result, dealId) => {
    if (!result.destination) return;
    
    const newStage = result.destination.droppableId;
    const updatedDeals = deals.map(deal => 
      deal.id === dealId ? { ...deal, stage: newStage } : deal
    );
    
    setDeals(updatedDeals);
    localStorage.setItem('deals', JSON.stringify(updatedDeals));
    toast.success(`Deal moved to ${columns.find(c => c.id === newStage)?.title}`);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🗓️ Kanban Board
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Drag and drop deals to update their stage
        </p>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72"
          >
            {/* Column Header */}
            <div className={`bg-gradient-to-r ${column.color} rounded-t-xl p-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{column.title}</h3>
                <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-lg">
                  {getDealsByStage(column.id).length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-b-xl p-3 min-h-[400px] max-h-[600px] overflow-y-auto">
              {getDealsByStage(column.id).map((deal) => (
                <DealCard key={deal.id} deal={deal} onDragEnd={handleDragEnd} getScoreColor={getScoreColor} />
              ))}
              
              {getDealsByStage(column.id).length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <span className="text-3xl mb-2 block">📦</span>
                  <p className="text-sm">No deals in this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnDeals = getDealsByStage(column.id);
          const totalValue = columnDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
          
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{column.title}</span>
                <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`}></span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {columnDeals.length} deals
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                ${totalValue.toLocaleString()}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Individual Deal Card Component with Drag & Drop
const DealCard = ({ deal, onDragEnd, getScoreColor }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const score = deal.aiScore || Math.floor(Math.random() * 40) + 60;

  return (
    <Reorder.Item
      value={deal}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(result) => {
        setIsDragging(false);
        onDragEnd(result, deal.id);
      }}
      whileDrag={{ scale: 1.05, zIndex: 100 }}
      className={`mb-3 p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-[#FF6B6B]' : ''
      }`}
    >
      {/* Deal Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
          {deal.title}
        </h4>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>

      {/* Company & Contact */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {deal.company && `🏢 ${deal.company}`}
      </p>

      {/* Deal Value */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-[#FF6B6B]">
          ${parseFloat(deal.value || 0).toLocaleString()}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          deal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          deal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {deal.priority || 'medium'}
        </span>
      </div>

      {/* Contact Info */}
      {deal.contactName && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            👤 {deal.contactName}
          </p>
        </div>
      )}

      {/* Expected Close Date */}
      {deal.expectedClose && (
        <div className="mt-2 flex items-center text-xs text-gray-400 dark:text-gray-500">
          <span className="mr-1">📅</span>
          {new Date(deal.expectedClose).toLocaleDateString()}
        </div>
      )}
    </Reorder.Item>
  );
};

export default KanbanBoard;
