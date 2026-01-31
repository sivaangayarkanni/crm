import React, { useState, useEffect } from 'react';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('contacts');
    if (saved) setContacts(JSON.parse(saved));
  }, []);

  const saveContact = () => {
    if (!form.name) return;
    const newContact = { ...form, id: Date.now() };
    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem('contacts', JSON.stringify(updated));
    setForm({ name: '', email: '', phone: '', company: '' });
  };

  const deleteContact = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    localStorage.setItem('contacts', JSON.stringify(updated));
  };

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#2D3748]" style={{fontFamily: 'Poppins, sans-serif'}}>Contacts</h1>
        <button 
          onClick={saveContact} 
          className="bg-[#FF6B6B] text-white px-3 py-1.5 rounded-full hover:bg-[#4ECDC4] transition-all duration-300 text-sm shadow-lg transform hover:-translate-y-0.5"
        >
          ➕ Add
        </button>
      </div>
      
      <div className="grid lg:grid-cols-4 gap-3">
        <div className="bg-white/95 backdrop-blur p-3 rounded-2xl shadow-lg">
          <h3 className="font-semibold mb-2 text-[#2D3748] text-sm" style={{fontFamily: 'Poppins, sans-serif'}}>New Contact</h3>
          <div className="space-y-2">
            <input 
              placeholder="Name" 
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
            <input 
              placeholder="Company" 
              value={form.company} 
              onChange={(e) => setForm({...form, company: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:border-[#FF6B6B] focus:outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="relative mb-3">
            <span className="absolute left-2 top-2 text-gray-400 text-sm">🔍</span>
            <input 
              placeholder="Search contacts..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 p-2 border border-gray-200 rounded-xl text-xs focus:border-[#4ECDC4] focus:outline-none transition-all"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {filtered.map(contact => (
              <div key={contact.id} className="bg-white/95 backdrop-blur p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-[#2D3748] text-sm">{contact.name}</h4>
                    <p className="text-xs text-gray-600">{contact.company}</p>
                  </div>
                  <div className="flex gap-1">
                    {contact.email && <span className="text-[#4ECDC4] text-sm">📧</span>}
                    {contact.phone && <span className="text-[#45B7D1] text-sm">📞</span>}
                    <button 
                      onClick={() => deleteContact(contact.id)}
                      className="text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {contact.email && <div>{contact.email}</div>}
                  {contact.phone && <div>{contact.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;