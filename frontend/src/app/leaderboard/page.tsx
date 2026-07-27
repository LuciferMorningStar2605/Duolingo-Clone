'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/context/UserContext';
import styles from './page.module.css';

interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  streak_count: number;
  avatar_url: string | null;
  is_current_user: boolean;
}

export default function Leaderboard() {
  const { user } = useUser();
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('http://localhost:8000/api/leaderboard');
        if (!res.ok) {
          throw new Error('Failed to retrieve leaderboard rankings');
        }
        const data = await res.json();
        setStandings(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  // Extract Podium Spots: Gold, Silver, Bronze
  const silverSpot = standings.find((u) => u.rank === 2);
  const goldSpot = standings.find((u) => u.rank === 1);
  const bronzeSpot = standings.find((u) => u.rank === 3);

  // Extract Remaining rows
  const remainingRows = standings.filter((u) => u.rank > 3);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Weekly Leaderboard</h1>

        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Gathering league results...</p>
          </div>
        ) : error ? (
          <div className={styles.loaderContainer}>
            <p style={{ color: 'var(--color-pink)' }}>⚠️ {error}</p>
          </div>
        ) : (
          <>
            {/* Podium Visual */}
            <div className={styles.podiumContainer}>
              
              {/* 2nd Place (Silver) */}
              {silverSpot && (
                <div className={`${styles.podiumSpot} ${styles.silver}`}>
                  {/* Avatar */}
                  <img
                    src={silverSpot.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=silver'}
                    alt={silverSpot.username}
                    width={60}
                    height={60}
                    className={styles.podiumAvatar}
                  />
                  <div className={styles.podiumBadge}>2</div>
                  <div className={styles.podiumPedestal}>
                    <span className={styles.podiumName}>{silverSpot.username}</span>
                    <span className={styles.podiumXp}>{silverSpot.xp} XP</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {goldSpot && (
                <div className={`${styles.podiumSpot} ${styles.gold}`}>
                  {/* Avatar */}
                  <img
                    src={goldSpot.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=gold'}
                    alt={goldSpot.username}
                    width={70}
                    height={70}
                    className={styles.podiumAvatar}
                  />
                  <div className={styles.podiumBadge}>1</div>
                  <div className={styles.podiumPedestal}>
                    <span className={styles.podiumName} style={{ fontWeight: 800 }}>{goldSpot.username}</span>
                    <span className={styles.podiumXp}>{goldSpot.xp} XP</span>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {bronzeSpot && (
                <div className={`${styles.podiumSpot} ${styles.bronze}`}>
                  {/* Avatar */}
                  <img
                    src={bronzeSpot.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=bronze'}
                    alt={bronzeSpot.username}
                    width={55}
                    height={55}
                    className={styles.podiumAvatar}
                  />
                  <div className={styles.podiumBadge}>3</div>
                  <div className={styles.podiumPedestal}>
                    <span className={styles.podiumName}>{bronzeSpot.username}</span>
                    <span className={styles.podiumXp}>{bronzeSpot.xp} XP</span>
                  </div>
                </div>
              )}

            </div>

            {/* Rest of Leaderboard list */}
            <div className={styles.listContainer}>
              {remainingRows.map((entry) => (
                <div
                  key={entry.username}
                  className={`${styles.rowCard} ${entry.is_current_user ? styles.highlightCard : ''}`}
                >
                  <span className={styles.rank}>{entry.rank}</span>
                  <img
                    src={entry.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                    alt={entry.username}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                  <span className={styles.username}>{entry.username}</span>
                  {entry.streak_count > 0 && (
                    <span className={styles.streak}>🔥 {entry.streak_count}d</span>
                  )}
                  <span className={styles.xp}>{entry.xp} XP</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
