'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LessonPlayer from '@/components/LessonPlayer';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/config';
import styles from './page.module.css';

interface Exercise {
  id: number;
  type: string;
  prompt: string;
  correct_answer: string;
  content_json: string;
}

interface Lesson {
  id: number;
  skill_id: number;
  title: string;
  order: number;
  xp_reward: number;
  exercises: Exercise[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lessonId = params?.id;

  useEffect(() => {
    if (!lessonId) return;

    async function fetchLesson() {
      try {
        const res = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Lesson not found in the course database');
          }
          throw new Error('Failed to retrieve lesson data');
        }
        const data = await res.json();
        setLesson(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading exercise set...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className={styles.errorWrapper}>
        <h2>⚠️ Error Loading Lesson</h2>
        <p>{error || 'The requested lesson could not be loaded.'}</p>
        <button onClick={() => router.push('/')} className="btn-3d btn-green" style={{ marginTop: '16px' }}>
          Back to Path
        </button>
      </div>
    );
  }

  // Double check user hearts status before allowing entry
  if (user && user.hearts <= 0) {
    return (
      <div className={styles.errorWrapper}>
        <h2>💔 Out of Hearts</h2>
        <p>You need at least 1 heart to start a lesson. Refill them in the shop or complete a practice set!</p>
        <button onClick={() => router.push('/')} className="btn-3d btn-pink" style={{ marginTop: '16px' }}>
          Back to Path
        </button>
      </div>
    );
  }

  return <LessonPlayer lesson={lesson} />;
}
