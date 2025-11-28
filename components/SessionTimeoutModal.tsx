import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from './icons';

interface SessionTimeoutModalProps {
  onExtend: () => void;
  onLogout: () => void;
}

const COUNTDOWN_SECONDS = 120; // 2 minutes

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ onExtend, onLogout }) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onLogout]);
  
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-down">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-4">Session Timeout Warning</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                You've been inactive for a while. For your security, you will be automatically logged out in...
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white my-4">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                    onClick={onLogout}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <LogOut className="h-5 w-5" />
                    Log Out Now
                </button>
                <button
                    onClick={onExtend}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                    Stay Logged In
                </button>
            </div>
        </div>
    </div>
  );
};

export default SessionTimeoutModal;
