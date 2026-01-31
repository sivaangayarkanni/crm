import React, { useState, useEffect } from 'react';
import { Save, Palette, Globe, Bell } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: '',
    theme: 'blue',
    notifications: true,
    language: 'en',
    timezone: 'UTC'
  });

  useEffect(() => {
    const saved = localStorage.getItem('settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const saveSettings = () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  const themes = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Settings</h1>
        <button onClick={saveSettings} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
          <Save size={16} /> Save
        </button>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Globe size={16} /> General
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input 
                value={settings.companyName} 
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                className="w-full p-2 border rounded text-sm"
                placeholder="Your Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select 
                value={settings.language} 
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select 
                value={settings.timezone} 
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern</option>
                <option value="PST">Pacific</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Palette size={16} /> Theme
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {themes.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => setSettings({...settings, theme: theme.value})}
                  className={`p-2 rounded border text-sm flex items-center gap-2 ${
                    settings.theme === theme.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded ${theme.color}`}></div>
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Bell size={16} /> Notifications
            </h3>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              />
              <span className="text-sm">Enable notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;