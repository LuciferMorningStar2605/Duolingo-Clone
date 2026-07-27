'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/context/UserContext';
import styles from './page.module.css';

interface AchievementResponse {
  id: number;
  name: string;
  description: string;
  xp_required: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export default function Profile() {
  const { user } = useUser();
  const [achievements, setAchievements] = useState<AchievementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const res = await fetch('http://localhost:8000/api/achievements');
        if (!res.ok) {
          throw new Error('Failed to retrieve achievements data');
        }
        const data = await res.json();
        setAchievements(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadAchievements();
    }
  }, [user]);

  // Helper to calculate progress values dynamically for display
  const getAchievementProgress = (ach: AchievementResponse) => {
    if (!user) return { current: 0, target: 0, percent: 0 };
    
    let current = 0;
    let target = ach.xp_required;

    if (ach.name === 'XP Milestone') {
      current = user.xp;
      target = 100;
    } else if (ach.name === 'Streak Master') {
      current = user.streak_count;
      target = 3;
    } else if (ach.name === 'Hearts Survivor') {
      current = user.hearts === 5 ? Math.max(0, user.xp) : 0;
      target = 50;
    }

    const percent = Math.min(100, target > 0 ? (current / target) * 100 : 0);
    return { current, target, percent };
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        
        {/* Profile Card Header */}
        <div className={styles.profileCard}>
          <img
            src={user.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=learner_duo'}
            alt="Learner Avatar"
            width={90}
            height={90}
            className={styles.avatar}
          />
          <div className={styles.userInfo}>
            <h1 className={styles.username}>{user.username}</h1>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <h2 className={styles.sectionHeader}>Statistics</h2>
        <div className={styles.statsGrid}>
          
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🔥</div>
            <div>
              <div className={styles.statVal} style={{ color: 'var(--color-orange)' }}>
                {user.streak_count} Days
              </div>
              <div className={styles.statLbl}>Active Streak</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIcon}>⚡</div>
            <div>
              <div className={styles.statVal} style={{ color: 'var(--color-green)' }}>
                {user.xp} XP
              </div>
              <div className={styles.statLbl}>Total XP</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIcon}>💎</div>
            <div>
              <div className={styles.statVal} style={{ color: 'var(--color-blue)' }}>
                {user.gems}
              </div>
              <div className={styles.statLbl}>Gems Balance</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIcon}>❤️</div>
            <div>
              <div className={styles.statVal} style={{ color: 'var(--color-pink)' }}>
                {user.hearts} / 5
              </div>
              <div className={styles.statLbl}>Hearts Level</div>
            </div>
          </div>

        </div>

        {/* Achievements Section */}
        <h2 className={styles.sectionHeader}>Achievements</h2>
        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your trophies...</p>
          </div>
        ) : error ? (
          <div className={styles.loaderContainer}>
            <p style={{ color: 'var(--color-pink)' }}>⚠️ {error}</p>
          </div>
        ) : (
          <div className={styles.achievementsList}>
            {achievements.map((ach) => {
              const { current, target, percent } = getAchievementProgress(ach);

              return (
                <div
                  key={ach.id}
                  className={`${styles.achievementCard} ${ach.unlocked ? styles.achUnlocked : ''}`}
                >
                  <div className={styles.achBadge}>
                    {ach.unlocked ? '🏆' : '🔒'}
                  </div>
                  <div className={styles.achInfo}>
                    <h3 className={styles.achTitle}>{ach.name}</h3>
                    <p className={styles.achDesc}>{ach.description}</p>
                    
                    {!ach.unlocked && (
                      <div style={{ marginTop: '4px' }}>
                        <div className={styles.achProgressContainer}>
                          <div
                            className={styles.achProgressBar}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '10px', color: 'var(--color-gray-500)' }}>
                          <span>{current} / {target}</span>
                          <span>{Math.round(percent)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.achStatus}>
                    {ach.unlocked ? 'Earned' : 'Locked'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
