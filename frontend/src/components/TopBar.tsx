'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { user, refreshUser } = useUser();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Sync state with user profile response
  useEffect(() => {
    if (user && user.hearts < 5 && user.next_heart_regenerate_in_seconds !== null) {
      setSecondsLeft(user.next_heart_regenerate_in_seconds);
    } else {
      setSecondsLeft(null);
    }
  }, [user]);

  // Tick timer down
  useEffect(() => {
    if (secondsLeft === null) return;

    if (secondsLeft <= 0) {
      // Re-trigger profile sync
      refreshUser();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, refreshUser]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <header className={styles.topbar}>
      {/* Flag / Course Selector (Mocked) */}
      <div className={styles.flagContainer}>
        <span className={styles.flag}>🇪🇸</span>
        <span className={styles.langText}>Spanish</span>
      </div>

      <div className={styles.statsContainer}>
        {/* Streak */}
        <Link href="/profile" className={`${styles.statItem} ${styles.streak}`} title="Active Daily Streak">
          <span>🔥</span>
          <span>{user.streak_count}</span>
        </Link>

        {/* Gems */}
        <Link href="/shop" className={`${styles.statItem} ${styles.gems}`} title="Gems">
          <span>💎</span>
          <span>{user.gems}</span>
        </Link>

        {/* Hearts */}
        <Link href="/shop" className={`${styles.statItem} ${styles.hearts}`} title="Hearts Status">
          <span>❤️</span>
          <span>{user.hearts === 0 ? 'Empty' : user.hearts}</span>
          {user.hearts < 5 && secondsLeft !== null && secondsLeft > 0 && (
            <span className={styles.heartTimer}>({formatTime(secondsLeft)})</span>
          )}
        </Link>
      </div>
    </header>
  );
}
