import React from 'react';
import { Outlet } from 'react-router-dom';

import NowPlayingPanel from './NowPlayingPanel';
import PlayerBar from './PlayerBar';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppShell = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="shell-center">
      <TopBar />
      <div className="shell-main">
        <div className="shell-scroll">
          <Outlet />
        </div>
        <PlayerBar />
      </div>
    </div>
    <NowPlayingPanel />
  </div>
);

export default AppShell;
