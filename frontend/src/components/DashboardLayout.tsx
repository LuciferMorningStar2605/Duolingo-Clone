'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <TopBar />
        {children}
      </div>
    </div>
  );
}
