import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);