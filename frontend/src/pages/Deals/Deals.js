import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState({ title: '', value: '', stage: 'prospect', contact: '' });

  useEffect(() => {
    const saved = localStorage.getItem('deals');
    if (saved) setDeals(JSON.parse(saved));
  }, []);

  const saveDeal = () => {
    if (!form.title) return;
    const newDeal = { ...form, id: Date.now(), date: new Date().toLocaleDateString() };
    const updated = [...deals, newDeal];
    setDeals(updated);
    localStorage.setItem('deals', JSON.stringify(updated));
    setForm({ title: '', value: '', stage: 'prospect', contact: '' });
  };

  const stages = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed'];
  const stageColors = {
    prospect: 'bg-gray-100 text-gray-800',
    qualified: 'bg-blue-100 text-blue-800',
    proposal: 'bg-yellow-100 text-yellow-800',
    negotiation: 'bg-orange-100 text-orange-800',
    closed: 'bg-green-100 text-green-800'
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Deals Pipeline</h1>
        <button onClick={saveDeal} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
          <Plus size={16} /> Add Deal
        </button>
      </div>
      
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3">New Deal</h3>
          <div className="space-y-2">
            <input 
              placeholder="Deal title" 
              value={form.title} 
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            />
            <input 
              placeholder="Value ($)" 
              type="number"
              value={form.value} 
              onChange={(e) => setForm({...form, value: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            />
            <select 
              value={form.stage} 
              onChange={(e) => setForm({...form, stage: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            >
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <input 
              placeholder="Contact name" 
              value={form.contact} 
              onChange={(e) => setForm({...form, contact: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deals.map(deal => (
              <div key={deal.id} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{deal.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${stageColors[deal.stage]}`}>
                    {deal.stage}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  {deal.value && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} />
                      ${deal.value}
                    </div>
                  )}
                  {deal.contact && (
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      {deal.contact}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {deal.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deals;