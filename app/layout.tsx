import React from 'react';

export const metadata = {
  title: 'Sovereign Capital Holding',
  description: 'Multi-Wallet Portfolio Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      
        
      
      
        {children}
      
    
  );
}
