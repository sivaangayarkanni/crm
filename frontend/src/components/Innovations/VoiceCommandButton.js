// Voice Command Button - Hands-free navigation
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';

const VoiceCommandButton = ({ compact = false }) => {
  const { isListening, transcript, error, startListening, speak, isSupported } = useVoiceCommands();
  const [showHelp, setShowHelp] = useState(false);

  if (!isSupported) return null;

  const voiceCommands = [
    { command: '"Go to dashboard"', action: 'Navigate to home' },
    { command: '"Go to leads"', action: 'Open leads page' },
    { command: '"Go to deals"', action: 'Open deals page' },
    { command: '"Add lead"', action: 'Open add lead form' },
    { command: '"Dark mode"', action: 'Toggle dark theme' },
    { command: '"Help"', action: 'Show all commands' },
  ];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          startListening();
          if (!isListening) speak('Listening for command');
        }}
        className={`relative ${compact ? 'p-2' : 'px-4 py-2'} rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white shadow-lg flex items-center gap-2`}
      >
        <motion.span
          animate={isListening ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
          className={isListening ? 'text-red-200' : ''}
        >
          {isListening ? '🎤' : '🎙️'}
        </motion.span>
        {!compact && <span className="font-medium">Voice</span>}
        
        {isListening && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {(isListening || showHelp) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl p-4 z-50"
          >
            {isListening ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 20, 8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                        className="w-2 bg-[#FF6B6B] rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">Listening...</span>
                </div>
                
                {transcript && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-[#2D3748] font-medium">"{transcript}"</p>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-[#2D3748]">Voice Commands</h4>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-2">
                  {voiceCommands.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-[#FF6B6B]">
                        {item.command}
                      </code>
                      <span className="text-xs text-gray-500">{item.action}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Click the button and speak a command
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!compact && !isListening && !showHelp && (
        <button
          onClick={() => setShowHelp(true)}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 hover:text-gray-600"
        >
          ?
        </button>
      )}
    </div>
  );
};

export default VoiceCommandButton;
