import './App.css';
import React, { useEffect, useMemo, useState } from 'react';

import Dash0 from './Dash0';
import Dash1 from './Dash1';
import Dash2 from './Dash2';
import Dash3 from './Dash3';

type AppProps = { theme?: 'dark' | 'lite' };

// Simple hash-based router + two-pane layout with collapsible nav
const App: React.FC<AppProps> = ({ theme = 'dark' }) => {
  const getRoute = () => {
    const raw = window.location.hash || '#/dash0';
    const path = raw.startsWith('#') ? raw.slice(1) : raw;
    return path || '/dash0';
  };

  const [route, setRoute] = useState<string>(getRoute());
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '#/dash0';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const content = useMemo(() => {
    switch (route) {
      case '/dash1':
        return <Dash1 />;
      case '/dash2':
        return <Dash2 />;
      case '/dash3':
        return <Dash3 />;
      case '/dash0':
      default:
        return <Dash0 />;
    }
  }, [route]);

  const palette = theme === 'lite'
    ? {
        // bodyBg: '#f6f8fb',
        bodyBg: 'white',
        text: '#1f2937',
        navBg: '#ffffff',
        navBorder: '#e5e9f0',
        btnBg: '#ffffff',
        btnBorder: '#cbd5e1',
        linkInactive: '#334155',
        linkActiveBg: '#2563eb',
      }
    : {
        bodyBg: '#0f172a',
        text: '#e5e7eb',
        navBg: '#0b1220',
        navBorder: '#263043',
        btnBg: '#111827',
        btnBorder: '#334155',
        linkInactive: '#cbd5e1',
        linkActiveBg: '#2563eb',
      } as const;

  const linkStyle = (path: string) => ({
    display: 'block',
    padding: '8px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    color: route === path ? '#fff' : palette.linkInactive,
    background: route === path ? palette.linkActiveBg : 'transparent',
    fontWeight: route === path ? 700 : 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', width: '100%', background: palette.bodyBg, color: palette.text }}>
      {!collapsed && (
        <aside
          style={{
            width: 240,
            transition: 'width 0.2s ease',
            borderRight: `1px solid ${palette.navBorder}`,
            background: palette.navBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'left' }}>ReactTableCSV Demos</div>
            <button
              onClick={() => setCollapsed(true)}
              title={'Collapse'}
              style={{
                width: 40,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${palette.btnBorder}`,
                background: palette.btnBg,
                color: palette.text,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                fontSize: 18,
              }}
            >
              «
            </button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
            <a href="#/dash0" style={linkStyle('/dash0')}>Dash 0 · Local CSV/JSON</a>
            <a href="#/dash1" style={linkStyle('/dash1')}>Dash 1 · Dashboard</a>
            <a href="#/dash2" style={linkStyle('/dash2')}>Dash 2 · NoSQL</a>
            <a href="#/dash3" style={linkStyle('/dash3')}>Dash 3 · DuckDB Attach</a>
          </nav>
        </aside>
      )}

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title={'Expand navigation'}
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            zIndex: 10,
            width: 40,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${palette.btnBorder}`,
            background: palette.btnBg,
            color: palette.text,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            fontSize: 18,
          }}
        >
          »
        </button>
      )}

      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <div style={{ padding: 16 }}>
          <h1 style={{ marginTop: 0, textAlign: 'center' }}>React Table CSV – Demo</h1>
          {content}
        </div>
      </main>
    </div>
  );
};

export default App;
