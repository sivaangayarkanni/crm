// Voice Commands Hook - Hands-free navigation and actions
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useVoiceCommands = (enabled = true) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const commands = {
    // Navigation commands
    'go to dashboard': () => navigate('/app/dashboard'),
    'go home': () => navigate('/app/dashboard'),
    'open dashboard': () => navigate('/app/dashboard'),
    'go to leads': () => navigate('/app/leads'),
    'open leads': () => navigate('/app/leads'),
    'show leads': () => navigate('/app/leads'),
    'go to contacts': () => navigate('/app/contacts'),
    'open contacts': () => navigate('/app/contacts'),
    'go to deals': () => navigate('/app/deals'),
    'open deals': () => navigate('/app/deals'),
    'go to analytics': () => navigate('/app/analytics'),
    'open analytics': () => navigate('/app/analytics'),
    'go to settings': () => navigate('/app/settings'),
    'open settings': () => navigate('/app/settings'),
    'go to billing': () => navigate('/app/billing'),
    'go back': () => navigate(-1),
    
    // Action commands
    'add lead': () => {
      toast.success('Voice command: Add lead form opened');
      // Trigger add lead modal
    },
    'create deal': () => {
      toast.success('Voice command: Create deal form opened');
    },
    'search': () => {
      toast.success('Voice command: Search activated');
    },
    'help': () => {
      toast.success('Voice commands: Dashboard, Leads, Contacts, Deals, Analytics, Settings, Billing, Add lead, Create deal, Search');
    },
    'dark mode': () => {
      document.documentElement.classList.toggle('dark');
      toast.success('Theme toggled');
    },
    'light mode': () => {
      document.documentElement.classList.remove('dark');
      toast.success('Light mode activated');
    },
  };

  const processCommand = useCallback((text) => {
    const normalizedText = text.toLowerCase().trim();
    
    for (const [command, action] of Object.entries(commands)) {
      if (normalizedText.includes(command)) {
        action();
        return true;
      }
    }
    return false;
  }, [navigate]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      
      if (!processCommand(text)) {
        toast.error(`Command not recognized: "${text}"`);
      }
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [processCommand]);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    speak,
    isSupported: ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window),
  };
};
