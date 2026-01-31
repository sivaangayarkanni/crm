import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState({ leads: 0, contacts: 0, deals: 0, revenue: 0 });

  useEffect(() => {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const deals = JSON.parse(localStorage.getItem('deals') || '[]');
    
    const revenue = deals
      .filter(d => d.stage === 'closed')
      .reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    
    setData({
      leads: leads.length,
      contacts: contacts.length,
      deals: deals.length,
      revenue
    });
  }, []);

  const stats = [
    { label: 'Total Leads', value: data.leads, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Contacts', value: data.contacts, icon: Users, color: 'text-green-600' },
    { label: 'Active Deals', value: data.deals, icon: BarChart3, color: 'text-purple-600' },
    { label: 'Revenue', value: `$${data.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-600' }
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Analytics Dashboard</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className={`${stat.color}`} size={32} />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3">Quick Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Conversion Rate:</span>
              <span className="font-semibold">
                {data.leads > 0 ? ((data.deals / data.leads) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Deal Value:</span>
              <span className="font-semibold">
                ${data.deals > 0 ? (data.revenue / data.deals).toFixed(0) : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Contact to Deal:</span>
              <span className="font-semibold">
                {data.contacts > 0 ? ((data.deals / data.contacts) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3">Performance</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Lead Generation</span>
                <span>{Math.min(100, (data.leads / 10) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{width: `${Math.min(100, (data.leads / 10) * 100)}%`}}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Deal Closure</span>
                <span>{Math.min(100, (data.deals / 5) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{width: `${Math.min(100, (data.deals / 5) * 100)}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;