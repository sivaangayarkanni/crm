import React, { useState, useEffect } from 'react';
import { Users, Building, BarChart3, Settings, Plus, Search, Zap, Globe, Crown, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({ totalTenants: 0, activeUsers: 0, revenue: 0 });
  const [newTenant, setNewTenant] = useState({ name: '', domain: '', plan: 'free' });
  const [analytics, setAnalytics] = useState({ growth: 15, conversion: 8.5, churn: 2.1 });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const savedTenants = JSON.parse(localStorage.getItem('tenants') || '[]');
    setTenants(savedTenants);
    setStats({
      totalTenants: savedTenants.length,
      activeUsers: savedTenants.reduce((sum, t) => sum + (t.users || 0), 0),
      revenue: savedTenants.reduce((sum, t) => sum + (t.revenue || 0), 0)
    });
    
    // Mock activities
    setActivities([
      { id: 1, action: 'New tenant registered', tenant: 'Acme Corp', time: '2 min ago' },
      { id: 2, action: 'Plan upgraded', tenant: 'Tech Solutions', time: '15 min ago' },
      { id: 3, action: 'User limit reached', tenant: 'StartupXYZ', time: '1 hour ago' }
    ]);
  }, []);

  const addTenant = () => {
    if (!newTenant.name) return;
    const tenant = { 
      ...newTenant, 
      id: Date.now(), 
      users: Math.floor(Math.random() * 50), 
      revenue: Math.floor(Math.random() * 1000), 
      status: 'active',
      created: new Date().toLocaleDateString()
    };
    const updated = [...tenants, tenant];
    setTenants(updated);
    localStorage.setItem('tenants', JSON.stringify(updated));
    setNewTenant({ name: '', domain: '', plan: 'free' });
  };

  const quickActions = [
    { icon: Plus, label: 'Add Tenant', color: 'bg-[#FF6B6B]', action: addTenant },
    { icon: Settings, label: 'System Config', color: 'bg-[#4ECDC4]' },
    { icon: Activity, label: 'Monitor', color: 'bg-[#45B7D1]' },
    { icon: Globe, label: 'Domains', color: 'bg-[#FFE66D]' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D3748] to-[#4A5568] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Control Center</h1>
            <p className="text-gray-300 text-sm">Manage tenants, monitor performance</p>
          </div>
          <div className="flex gap-2">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button 
                  key={i}
                  onClick={action.action}
                  className={`${action.color} text-white p-2 rounded-xl hover:scale-105 transition-all shadow-lg`}
                  title={action.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Tenants</p>
                <p className="text-2xl font-bold text-[#2D3748]">{stats.totalTenants}</p>
                <p className="text-xs text-green-600">+{analytics.growth}% growth</p>
              </div>
              <Building className="text-[#FF6B6B]" size={32} />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Users</p>
                <p className="text-2xl font-bold text-[#2D3748]">{stats.activeUsers}</p>
                <p className="text-xs text-blue-600">+{analytics.conversion}% conversion</p>
              </div>
              <Users className="text-[#4ECDC4]" size={32} />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Revenue</p>
                <p className="text-2xl font-bold text-[#2D3748]">${stats.revenue}</p>
                <p className="text-xs text-red-600">-{analytics.churn}% churn</p>
              </div>
              <BarChart3 className="text-[#45B7D1]" size={32} />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Performance</p>
                <p className="text-2xl font-bold text-[#2D3748]">98.5%</p>
                <p className="text-xs text-green-600">Uptime</p>
              </div>
              <Zap className="text-[#FFE66D]" size={32} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Quick Add Tenant */}
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <h3 className="font-bold mb-3 text-[#2D3748] text-sm flex items-center gap-2">
              <Plus size={16} /> Quick Add
            </h3>
            <div className="space-y-2">
              <input 
                placeholder="Company" 
                value={newTenant.name}
                onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none"
              />
              <input 
                placeholder="Domain" 
                value={newTenant.domain}
                onChange={(e) => setNewTenant({...newTenant, domain: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none"
              />
              <select 
                value={newTenant.plan}
                onChange={(e) => setNewTenant({...newTenant, plan: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Tenant List */}
          <div className="lg:col-span-2 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <h3 className="font-bold mb-3 text-[#2D3748] text-sm flex items-center gap-2">
              <Building size={16} /> Active Tenants
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tenants.map(tenant => (
                <div key={tenant.id} className="border border-gray-200 p-3 rounded-xl hover:border-[#4ECDC4] transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-[#2D3748] text-sm">{tenant.name}</h4>
                      <p className="text-xs text-gray-600">{tenant.domain}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tenant.plan === 'enterprise' ? 'bg-[#FFE66D] text-[#2D3748]' :
                        tenant.plan === 'pro' ? 'bg-[#4ECDC4] text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {tenant.plan}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{tenant.users} users</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl">
            <h3 className="font-bold mb-3 text-[#2D3748] text-sm flex items-center gap-2">
              <Activity size={16} /> Live Activity
            </h3>
            <div className="space-y-2">
              {activities.map(activity => (
                <div key={activity.id} className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-[#2D3748]">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.tenant}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;