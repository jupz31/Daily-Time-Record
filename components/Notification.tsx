import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from './icons';

interface NotificationProps {
  notification: {
    id: number;
    message: string;
    type: 'success' | 'error';
  };
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const { message, type } = notification;
  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-24 right-4 sm:right-6 lg:right-8 z-50 w-full max-w-sm p-4 rounded-lg shadow-lg flex items-start gap-3 transition-transform animate-fade-in-down
      ${isSuccess ? 'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'}
    `}>
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      </div>
      <div className="flex-grow text-sm">
        <p className="font-semibold">{isSuccess ? 'Success' : 'Error'}</p>
        <p>{message}</p>
      </div>
      <button onClick={onDismiss} className="p-1 rounded-full hover:bg-black/10 -mt-1 -mr-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Notification;
