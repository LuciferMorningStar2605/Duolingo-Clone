'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  streak_count: number;
  last_active_date: string | null;
  xp: number;
  hearts: number;
  last_heart_loss: string | null;
  gems: number;
  next_heart_regenerate_in_seconds: number | null;
}

interface UserContextType {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  refillHearts: (refillType: 'gems' | 'practice') => Promise<void>;
  resetProgress: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:8000/api';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`);
      if (!res.ok) {
        throw new Error('Failed to load user profile');
      }
      const data = await res.json();
      setUser(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Periodic heartbeat to poll for heart regeneration if hearts are depleted
  useEffect(() => {
    if (!user || user.hearts >= 5) return;

    const interval = setInterval(() => {
      fetchUser();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, fetchUser]);

  const refillHearts = async (refillType: 'gems' | 'practice') => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/refill-hearts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refill_type: refillType }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Refill failed');
      }

      const data = await res.json();
      setUser(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetProgress = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/reset`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to reset user statistics');
      }

      const data = await res.json();
      setUser(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        refillHearts,
        resetProgress,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
