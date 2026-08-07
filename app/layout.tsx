import React from 'react';

export const metadata = {
  title: 'Sovereign Capital Holding',
  description: 'Multi-Wallet Portfolio Dashboard',
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return React.createElement(
    'html',
    { lang: 'en' },
    React.createElement(
      'head',
      null,
      React.createElement('script', { src: 'https://cdn.tailwindcss.com' })
    ),
    React.createElement(
      'body',
      { className: 'bg-slate-950 text-slate-100 antialiased min-h-screen' },
      props.children
    )
  );
}
