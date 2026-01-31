import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, Crown } from 'lucide-react';

const Billing = () => {
  const [billing, setBilling] = useState({
    plan: 'free',
    cardNumber: '',
    expiryDate: '',
    billingAddress: '',
    nextBilling: '2024-02-01'
  });
  
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('billing');
    if (saved) setBilling(JSON.parse(saved));
    
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
  }, []);

  const saveBilling = () => {
    localStorage.setItem('billing', JSON.stringify(billing));
    alert('Billing info saved!');
  };

  const plans = [
    { id: 'free', name: 'Free', price: 0, features: ['5 Contacts', 'Basic CRM'] },
    { id: 'pro', name: 'Pro', price: 29, features: ['Unlimited Contacts', 'Analytics', 'Integrations'] },
    { id: 'enterprise', name: 'Enterprise', price: 99, features: ['Everything', 'White-label', 'Priority Support'] }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Billing & Subscription</h1>
        <button onClick={saveBilling} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Save Changes
        </button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Crown size={16} /> Current Plan: {plans.find(p => p.id === billing.plan)?.name}
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {plans.map(plan => (
                <div 
                  key={plan.id} 
                  className={`p-3 border rounded-lg cursor-pointer ${
                    billing.plan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setBilling({...billing, plan: plan.id})}
                >
                  <h4 className="font-semibold">{plan.name}</h4>
                  <p className="text-lg font-bold text-blue-600">${plan.price}/mo</p>
                  <ul className="text-xs text-gray-600 mt-2">
                    {plan.features.map((feature, i) => (
                      <li key={i}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard size={16} /> Payment Method
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <input 
                placeholder="Card Number" 
                value={billing.cardNumber} 
                onChange={(e) => setBilling({...billing, cardNumber: e.target.value})}
                className="p-2 border rounded text-sm"
              />
              <input 
                placeholder="MM/YY" 
                value={billing.expiryDate} 
                onChange={(e) => setBilling({...billing, expiryDate: e.target.value})}
                className="p-2 border rounded text-sm"
              />
              <input 
                placeholder="Billing Address" 
                value={billing.billingAddress} 
                onChange={(e) => setBilling({...billing, billingAddress: e.target.value})}
                className="md:col-span-2 p-2 border rounded text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar size={16} /> Billing Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current Plan:</span>
                <span className="font-semibold">{plans.find(p => p.id === billing.plan)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Cost:</span>
                <span className="font-semibold">${plans.find(p => p.id === billing.plan)?.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Next Billing:</span>
                <span className="font-semibold">{billing.nextBilling}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign size={16} /> Recent Invoices
            </h3>
            <div className="space-y-2">
              {invoices.length === 0 ? (
                <p className="text-sm text-gray-500">No invoices yet</p>
              ) : (
                invoices.map((invoice, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{invoice.date}</span>
                    <span className="font-semibold">${invoice.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;