'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/context/UserContext';
import styles from './page.module.css';

export default function Shop() {
  const { user, refillHearts, loading } = useUser();
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  const handlePurchase = async (type: 'gems' | 'practice') => {
    try {
      setPurchaseStatus(null);
      await refillHearts(type);
      if (type === 'gems') {
        alert('❤️ Hearts refilled! Spent 150 Gems.');
      } else {
        alert('❤️ Heart gained through practice session!');
      }
    } catch (err: any) {
      alert('Purchase failed: ' + err.message);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Duo Shop</h1>

        {/* Balance Status card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceInfo}>
            <h2>Gems Balance</h2>
            <p>Spend your earned gems to buy powerups, freezes, and heart refills!</p>
          </div>
          <div className={styles.gemDisplay}>
            <span>💎</span>
            <span>{user.gems}</span>
          </div>
        </div>

        {/* Shop Items List */}
        <div className={styles.itemsList}>
          
          {/* Item 1: Refill Hearts (Gems) */}
          <div className={styles.shopItem}>
            <div className={styles.itemIcon} style={{ backgroundColor: 'var(--color-pink-light)' }}>
              ❤️
            </div>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>Refill Hearts</h3>
              <p className={styles.itemDesc}>Fully restore your hearts to 5 so you can continue learning Spanish phrases without interruption.</p>
            </div>
            <div className={styles.buyBtn}>
              {user.hearts >= 5 ? (
                <button disabled className="btn-3d btn-gray" style={{ width: '100%' }}>
                  Full
                </button>
              ) : (
                <button
                  disabled={loading || user.gems < 150}
                  onClick={() => handlePurchase('gems')}
                  className="btn-3d btn-pink"
                  style={{ width: '100%' }}
                >
                  {user.gems < 150 ? 'Need Gems' : '150 Gems'}
                </button>
              )}
            </div>
          </div>

          {/* Item 2: Practice Refill */}
          <div className={styles.shopItem}>
            <div className={styles.itemIcon} style={{ backgroundColor: 'var(--color-green-light)' }}>
              💪
            </div>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>Practice Session</h3>
              <p className={styles.itemDesc}>Complete a mock practice session. Restores 1 depleted heart for free without costing any gems.</p>
            </div>
            <div className={styles.buyBtn}>
              {user.hearts >= 5 ? (
                <button disabled className="btn-3d btn-gray" style={{ width: '100%' }}>
                  Full
                </button>
              ) : (
                <button
                  disabled={loading}
                  onClick={() => handlePurchase('practice')}
                  className="btn-3d btn-green"
                  style={{ width: '100%' }}
                >
                  Free
                </button>
              )}
            </div>
          </div>

          {/* Item 3: Streak Freeze (Mocked) */}
          <div className={`${styles.shopItem} ${styles.mockItem}`}>
            <div className={styles.itemIcon} style={{ backgroundColor: 'var(--color-orange-light)' }}>
              ❄️
            </div>
            <div className={styles.itemInfo}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <h3 className={styles.itemTitle}>Streak Freeze</h3>
              <p className={styles.itemDesc}>Allows your streak to remain active even if you do not complete a lesson on any calendar day.</p>
            </div>
            <div className={styles.buyBtn}>
              <button disabled className="btn-3d btn-gray" style={{ width: '100%' }}>
                200 Gems
              </button>
            </div>
          </div>

          {/* Item 4: Super Duolingo (Mocked) */}
          <div className={`${styles.shopItem} ${styles.mockItem}`}>
            <div className={styles.itemIcon} style={{ backgroundColor: 'var(--color-purple-light)' }}>
              🦉
            </div>
            <div className={styles.itemInfo}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <h3 className={styles.itemTitle}>Super Subscription</h3>
              <p className={styles.itemDesc}>Unlock unlimited hearts, zero advertisements, and exclusive legendary review modes!</p>
            </div>
            <div className={styles.buyBtn}>
              <button disabled className="btn-3d btn-gray" style={{ width: '100%' }}>
                Upgrade
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
