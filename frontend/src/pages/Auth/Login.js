import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (form.username && form.email && form.password) {
      localStorage.setItem('user', JSON.stringify({ ...form, isAuthenticated: true }));
      if (form.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6B6B] via-[#4ECDC4] to-[#45B7D1] flex items-center justify-center p-4" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur p-6 rounded-3xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] p-3 rounded-full w-fit mx-auto mb-4"
          >
            <div className="text-white text-2xl font-bold">TF</div>
          </motion.div>
          <h2 className="text-2xl font-bold text-[#2D3748] mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>Welcome Back</h2>
          <p className="text-gray-600 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setForm({...form, role: 'user'})}
              className={`py-2 px-3 rounded-xl transition-all text-sm font-medium ${
                form.role === 'user' 
                  ? 'bg-[#4ECDC4] text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:text-[#4ECDC4]'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setForm({...form, role: 'admin'})}
              className={`py-2 px-3 rounded-xl transition-all text-sm font-medium ${
                form.role === 'admin' 
                  ? 'bg-[#FF6B6B] text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:text-[#FF6B6B]'
              }`}
            >
              Admin
            </button>
          </div>

          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({...form, username: e.target.value})}
            className="w-full p-3 border border-gray-200 rounded-2xl focus:border-[#4ECDC4] focus:outline-none transition-all focus:shadow-lg"
            style={{fontFamily: 'Inter, sans-serif'}}
            required
          />

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            className="w-full p-3 border border-gray-200 rounded-2xl focus:border-[#4ECDC4] focus:outline-none transition-all focus:shadow-lg"
            style={{fontFamily: 'Inter, sans-serif'}}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-2xl focus:border-[#4ECDC4] focus:outline-none transition-all pr-12 focus:shadow-lg"
              style={{fontFamily: 'Inter, sans-serif'}}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-[#4ECDC4] transition-colors text-sm"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
              form.role === 'admin'
                ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white'
                : 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white'
            }`}
            style={{fontFamily: 'Poppins, sans-serif'}}
          >
            Sign In as {form.role === 'admin' ? 'Admin' : 'User'}
          </motion.button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF6B6B] hover:text-[#4ECDC4] font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;