'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { resetProgress, loading } = useUser();

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all your progress, XP, streak, and achievements? This is for testing.')) {
      try {
        await resetProgress();
        alert('Progress reset successfully!');
      } catch (err: any) {
        alert('Reset failed: ' + err.message);
      }
    }
  };

  const menuItems = [
    {
      name: 'Learn',
      path: '/',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      name: 'Leaderboard',
      path: '/leaderboard',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 1 4 4v6H8V6a4 4 0 0 1 4-4Z" />
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      name: 'Shop',
      path: '/shop',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      )
    }
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoContainer}>
        {/* Cute Mascot SVG - Duo Owl */}
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#58cc02"/>
          {/* Eyes */}
          <circle cx="14" cy="18" r="7" fill="white"/>
          <circle cx="14" cy="18" r="3" fill="#3c3c3c"/>
          <circle cx="26" cy="18" r="7" fill="white"/>
          <circle cx="26" cy="18" r="3" fill="#3c3c3c"/>
          {/* Beak */}
          <path d="M20 22L17 26H23L20 22Z" fill="#ff9600"/>
          {/* Cheeks */}
          <ellipse cx="9" cy="23" rx="2" ry="1" fill="#ff4b4b" opacity="0.5"/>
          <ellipse cx="31" cy="23" rx="2" ry="1" fill="#ff4b4b" opacity="0.5"/>
        </svg>
        <span className={styles.logoText}>duolingo</span>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link href={item.path} key={item.name} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div>SDE Assignment</div>
        <button onClick={handleReset} className={styles.resetBtn} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Stats'}
        </button>
      </div>
    </div>
  );
}
