import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { WorkspaceProvider } from '../../context/WorkspaceContext';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <WorkspaceProvider>
      <div className="bento-canvas relative flex h-screen w-screen overflow-hidden text-zinc-100 selection:bg-[#FF5722]/30 selection:text-white">
        {/* Subtle top ambient spotlight matching the reference dashboard & homepage */}
        <div
          className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 z-0 h-96 w-[56rem] rounded-full opacity-[0.07] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, #FF5722 45%, transparent 75%)' }}
        />

        {/* Left Sidebar Navigation */}
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto px-5 pb-8 pt-2 lg:px-7 min-w-0">
            <div className="mx-auto max-w-[1520px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
};
