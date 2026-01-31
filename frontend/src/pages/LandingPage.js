import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, BarChart3, Zap, Shield, User, Settings } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
            TenantFlow
            <span className="text-[#FFE66D]"> CRM</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            Multi-tenant CRM platform with white-label capabilities, AI insights, and modern SaaS architecture
          </p>
          
          {/* Role Selection Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              to="/app/dashboard" 
              className="bg-white text-[#FF6B6B] px-8 py-4 rounded-full hover:bg-[#FFE66D] hover:text-[#FF6B6B] transition-all duration-300 flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <User size={24} />
              Enter as User
              <ArrowRight size={20} />
            </Link>
            <Link 
              to="/admin" 
              className="bg-[#2D3748] text-white px-8 py-4 rounded-full hover:bg-[#4A5568] transition-all duration-300 flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Settings size={24} />
              Admin Panel
              <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-[#FFE66D] text-[#2D3748] px-6 py-3 rounded-full hover:bg-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-white text-white px-6 py-3 rounded-full hover:bg-white hover:text-[#FF6B6B] transition-all duration-300 font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-[#FF6B6B] p-3 rounded-full w-fit mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="font-bold mb-2 text-[#2D3748]">Multi-Tenant</h3>
            <p className="text-sm text-gray-600">Complete data isolation with subdomain-based tenants</p>
          </div>
          <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-[#4ECDC4] p-3 rounded-full w-fit mb-4">
              <BarChart3 className="text-white" size={32} />
            </div>
            <h3 className="font-bold mb-2 text-[#2D3748]">AI Analytics</h3>
            <p className="text-sm text-gray-600">Smart insights and predictive lead scoring</p>
          </div>
          <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-[#FFE66D] p-3 rounded-full w-fit mb-4">
              <Zap className="text-[#2D3748]" size={32} />
            </div>
            <h3 className="font-bold mb-2 text-[#2D3748]">Real-time</h3>
            <p className="text-sm text-gray-600">Live collaboration and instant updates</p>
          </div>
          <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-[#45B7D1] p-3 rounded-full w-fit mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h3 className="font-bold mb-2 text-[#2D3748]">White-Label</h3>
            <p className="text-sm text-gray-600">Custom branding and domain mapping</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 text-center shadow-2xl">
          <h2 className="text-4xl font-bold mb-4 text-[#2D3748]">Ready to Transform Your CRM?</h2>
          <p className="text-gray-600 mb-6 text-lg">Join thousands of businesses using TenantFlow</p>
          <Link 
            to="/register" 
            className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white px-10 py-4 rounded-full hover:from-[#4ECDC4] hover:to-[#45B7D1] transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Your Journey
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;