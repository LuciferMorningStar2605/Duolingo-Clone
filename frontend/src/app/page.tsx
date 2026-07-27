'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SkillNode from '@/components/SkillNode';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/config';
import styles from './page.module.css';

interface LessonProgress {
  id: number;
  title: string;
  order: number;
  xp_reward: number;
  completed: boolean;
}

interface SkillResponse {
  id: number;
  unit_id: number;
  title: string;
  description: string;
  order: number;
  icon_type: string;
  lessons: LessonProgress[];
  completed: boolean;
  current_lesson_order: number;
  total_lessons: number;
  completed_lessons_count: number;
  unlocked: boolean;
}

interface UnitResponse {
  id: number;
  title: string;
  description: string;
  order: number;
  skills: SkillResponse[];
}

export default function Home() {
  const { user } = useUser();
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [loadingPath, setLoadingPath] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPath() {
      try {
        const res = await fetch(`${API_BASE_URL}/course/path`);
        if (!res.ok) {
          throw new Error('Failed to fetch learning path data');
        }
        const data = await res.json();
        setUnits(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading course map');
      } finally {
        setLoadingPath(false);
      }
    }

    if (user) {
      loadPath();
    }
  }, [user]);

  // Zig-zag styling offsets for Duolingo path alignment
  const offsets = [0, -35, -60, -35, 0, 35, 60, 35];

  return (
    <DashboardLayout>
      {loadingPath ? (
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your learning path...</p>
          <span style={{ fontSize: '11px', opacity: 0.6, marginTop: '8px' }}>
            Connecting to API: {API_BASE_URL}
          </span>
        </div>
      ) : error ? (
        <div className={styles.loaderContainer}>
          <p style={{ color: 'var(--color-pink)' }}>⚠️ {error}</p>
          <span style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '8px' }}>
            Target API: {API_BASE_URL}
          </span>
        </div>
      ) : (
        <div className={styles.pathContainer}>
          
          {/* Playful Welcome Banner */}
          <div className={styles.welcomeBanner}>
            <div className={styles.mascotContainer}>
              {/* Cute Duo Character */}
              <svg width="60" height="60" viewBox="0 0 40 40" fill="none" className="bounce-avatar">
                <rect width="40" height="40" rx="12" fill="#58cc02"/>
                <circle cx="14" cy="18" r="7" fill="white"/>
                <circle cx="14" cy="18" r="3" fill="#3c3c3c"/>
                <circle cx="26" cy="18" r="7" fill="white"/>
                <circle cx="26" cy="18" r="3" fill="#3c3c3c"/>
                <path d="M20 22L17 26H23L20 22Z" fill="#ff9600"/>
                <ellipse cx="9" cy="23" rx="2" ry="1" fill="#ff4b4b" opacity="0.5"/>
                <ellipse cx="31" cy="23" rx="2" ry="1" fill="#ff4b4b" opacity="0.5"/>
                {/* Waving wing */}
                <path d="M5 28C2 24 2 20 5 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.bannerContent}>
              <h2>¡Hola, {user?.username || 'Learner'}!</h2>
              <p>Welcome to your Spanish path. Complete lessons to earn XP, maintain your streak, and unlock units!</p>
            </div>
          </div>

          {/* Render Units */}
          {units.map((unit, uIdx) => {
            // Determine header banner color based on unit order
            const unitColors = [
              'var(--color-green)',
              'var(--color-blue)',
              'var(--color-purple)'
            ];
            const unitDarkColors = [
              'var(--color-green-dark)',
              'var(--color-blue-dark)',
              'var(--color-purple-dark)'
            ];
            const headerColor = unitColors[uIdx % unitColors.length];
            const borderColor = unitDarkColors[uIdx % unitDarkColors.length];

            return (
              <div key={unit.id} className={styles.unitCard}>
                <div 
                  className={styles.unitHeader}
                  style={{ 
                    backgroundColor: headerColor,
                    borderBottomColor: borderColor
                  }}
                >
                  <span className={styles.unitNumber}>Unit {unit.order}</span>
                  <h1 className={styles.unitTitle}>{unit.title}</h1>
                  <p className={styles.unitDesc}>{unit.description}</p>
                </div>

                <div className={styles.skillsPath}>
                  {/* Vertical connector line in background */}
                  <div className={styles.pathLine}></div>

                  {/* Render Skills inside Unit */}
                  {unit.skills.map((skill, sIdx) => {
                    const shiftX = offsets[sIdx % offsets.length];

                    return (
                      <div 
                        key={skill.id}
                        style={{ 
                          transform: `translateX(${shiftX}px)`,
                          position: 'relative',
                          zIndex: 5
                        }}
                      >
                        <SkillNode
                          id={skill.id}
                          title={skill.title}
                          description={skill.description}
                          icon_type={skill.icon_type}
                          order={skill.order}
                          completed={skill.completed}
                          current_lesson_order={skill.current_lesson_order}
                          total_lessons={skill.total_lessons}
                          completed_lessons_count={skill.completed_lessons_count}
                          unlocked={skill.unlocked}
                          lessons={skill.lessons}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
