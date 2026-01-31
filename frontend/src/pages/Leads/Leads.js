import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AIScoreBadge from '../../components/Innovations/AIScoreBadge';
import { useLeadScoring } from '../../hooks/useLeadScoring';
import toast from 'react-hot-toast';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'website', status: 'new' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('leads');
    if (saved) setLeads(JSON.parse(saved));
  }, []);

  const saveLead = () => {
    if (!form.name) {
      toast.error('Please enter a name');
      return;
    }
    const newLead = { ...form, id: Date.now(), date: new Date().toLocaleDateString() };
    const updated = [...leads, newLead];
    setLeads(updated);
    localStorage.setItem('leads', JSON.stringify(updated));
    setForm({ name: '', email: '', phone: '', source: 'website', status: 'new' });
    toast.success('Lead added successfully! 🤖 AI is calculating score...');
  };

  const updateStatus = (id, status) => {
    const updated = leads.map(lead => lead.id === id ? {...lead, status} : lead);
    setLeads(updated);
    localStorage.setItem('leads', JSON.stringify(updated));
    toast.success('Status updated!');
  };

  const deleteLead = (id) => {
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated);
    localStorage.setItem('leads', JSON.stringify(updated));
    toast.success('Lead deleted');
  };

  const filtered = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                         l.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    new: 'bg-[#45B7D1] text-white',
    contacted: 'bg-[#FFE66D] text-[#2D3748]',
    qualified: 'bg-[#4ECDC4] text-white',
    lost: 'bg-[#FF6B6B] text-white'
  };

  // Sort by AI score
  const sortedLeads = [...filtered].sort((a, b) => {
    const scoreA = useLeadScoring(a).score || 0;
    const scoreB = useLeadScoring(b).score || 0;
    return scoreB - scoreA;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-3" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-[#2D3748]" style={{fontFamily: 'Poppins, sans-serif'}}>
            Leads Management
          </h1>
          <span className="text-xs bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white px-2 py-0.5 rounded-full">
            🤖 AI Powered
          </span>
        </div>
        <button 
          onClick={saveLead} 
          className="bg-[#FF6B6B] text-white px-3 py-1.5 rounded-full hover:bg-[#4ECDC4] transition-all duration-300 text-sm shadow-lg transform hover:-translate-y-0.5 flex items-center gap-1"
        >
          <span>➕</span> Add Lead
        </button>
      </div>
      
      <div className="grid lg:grid-cols-4 gap-3">
        {/* Quick Add Form */}
        <div className="bg-white/95 backdrop-blur p-3 rounded-2xl shadow-lg">
          <h3 className="font-semibold mb-2 text-[#2D3748] text-sm flex items-center gap-2" style={{fontFamily: 'Poppins, sans-serif'}}>
            <span>📝</span> Quick Add
          </h3>
          <div className="space-y-2">
            <input 
              placeholder="Name *" 
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none transition-all"
            />
            <input 
              placeholder="Email" 
              value={form.email} 
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none transition-all"
            />
            <input 
              placeholder="Phone" 
              value={form.phone} 
              onChange={(e) => setForm({...form, phone: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none transition-all"
            />
            <select 
              value={form.source} 
              onChange={(e) => setForm({...form, source: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none transition-all"
            >
              <option value="website">🌐 Website</option>
              <option value="referral">🤝 Referral</option>
              <option value="social">📱 Social</option>
              <option value="ads">📢 Ads</option>
            </select>
            <select 
              value={form.status} 
              onChange={(e) => setForm({...form, status: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none transition-all"
            >
              <option value="new">🆕 New</option>
              <option value="contacted">📞 Contacted</option>
              <option value="qualified">✅ Qualified</option>
              <option value="lost">❌ Lost</option>
            </select>
          </div>
        </div>
        
        {/* Leads List */}
        <div className="lg:col-span-3">
          {/* Search & Filter */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <span className="absolute left-2 top-2 text-gray-400 text-sm">🔍</span>
              <input 
                placeholder="Search leads... (AI fuzzy search)" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 p-2 border border-gray-200 rounded-xl text-xs focus:border-[#4ECDC4] focus:outline-none transition-all"
              />
            </div>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border border-gray-200 rounded-xl text-xs focus:border-[#4ECDC4] focus:outline-none"
            >
              <option value="all">🎯 All</option>
              <option value="new">🆕 New</option>
              <option value="contacted">📞 Contacted</option>
              <option value="qualified">✅ Qualified</option>
              <option value="lost">❌ Lost</option>
            </select>
          </div>
          
          {/* Stats Summary */}
          <div className="flex gap-2 mb-3 text-xs">
            <span className="bg-gray-100 px-2 py-1 rounded-lg">
              🔥 Hot: {leads.filter(l => useLeadScoring(l).score >= 80).length}
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded-lg">
              ☀️ Warm: {leads.filter(l => {
                const score = useLeadScoring(l).score;
                return score >= 40 && score < 80;
              }).length}
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded-lg">
              ❄️ Cold: {leads.filter(l => useLeadScoring(l).score < 40).length}
            </span>
          </div>
          
          {/* Leads Grid */}
          <div className="grid md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {sortedLeads.map(lead => {
              const scoring = useLeadScoring(lead);
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/95 backdrop-blur p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2">
                      <AIScoreBadge score={scoring} size="sm" showDetails />
                      <div>
                        <h4 className="font-semibold text-[#2D3748] text-sm">{lead.name}</h4>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <span>📅</span> {lead.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition-all ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 text-xs text-gray-500 mb-2">
                    {lead.email && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        📧 {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        📞 {lead.phone}
                      </span>
                    )}
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                      🎯 {lead.source}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <select 
                      value={lead.status} 
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="text-xs p-1 border border-gray-200 rounded-lg focus:border-[#4ECDC4] focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="lost">Lost</option>
                    </select>
                    
                    <button
                      onClick={() => toast.success(`Contacting ${lead.name}...`)}
                      className="text-xs bg-[#4ECDC4] text-white px-3 py-1 rounded-full hover:bg-[#45B7D1] transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </motion.div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-8">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="text-gray-500 text-sm">No leads found</p>
                <p className="text-xs text-gray-400">Add your first lead to see AI scoring in action</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Leads;
