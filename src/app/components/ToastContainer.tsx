'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import { useAppSelector } from '../hooks';
import { removeToast } from '../uiSlice';

export default function ToastContainer() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(s => s.ui.toasts);

  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => dispatch(removeToast(t.id)), 3000));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, dispatch]);

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded-md shadow text-sm text-white ${
          t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        }`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}


