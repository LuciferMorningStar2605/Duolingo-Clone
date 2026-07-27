'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './SkillNode.module.css';

interface LessonProgress {
  id: number;
  title: string;
  order: number;
  xp_reward: number;
  completed: boolean;
}

interface SkillNodeProps {
  id: number;
  title: string;
  description: string;
  icon_type: string;
  order: number;
  completed: boolean;
  current_lesson_order: number;
  total_lessons: number;
  completed_lessons_count: number;
  unlocked: boolean;
  lessons: LessonProgress[];
}

export default function SkillNode({
  title,
  description,
  icon_type,
  order,
  completed,
  completed_lessons_count,
  total_lessons,
  unlocked,
  lessons,
}: SkillNodeProps) {
  const [showPopover, setShowPopover] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine node styling variables based on category (order-based)
  const getThemeColors = () => {
    if (!unlocked) {
      return {
        main: 'var(--color-gray-400)',
        dark: 'var(--color-gray-500)',
        light: 'var(--color-gray-100)',
      };
    }
    switch (icon_type) {
      case 'chat':
        return {
          main: 'var(--color-green)',
          dark: 'var(--color-green-dark)',
          light: 'var(--color-green-light)',
        };
      case 'travel':
        return {
          main: 'var(--color-blue)',
          dark: 'var(--color-blue-dark)',
          light: 'var(--color-blue-light)',
        };
      case 'food':
        return {
          main: 'var(--color-orange)',
          dark: 'var(--color-orange-dark)',
          light: 'var(--color-orange-light)',
        };
      case 'family':
        return {
          main: 'var(--color-purple)',
          dark: 'var(--color-purple-dark)',
          light: 'var(--color-purple-light)',
        };
      default:
        return {
          main: 'var(--color-yellow)',
          dark: 'var(--color-yellow-dark)',
          light: 'var(--color-yellow-light)',
        };
    }
  };

  const colors = getThemeColors();

  // Find next lesson to take
  const nextLesson = lessons.find((l) => !l.completed) || lessons[0];

  // SVG Progress Ring calculations
  // Width/Height: 102px, Radius: 47px, StrokeWidth: 6px
  const radius = 47;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progressPercent = total_lessons > 0 ? (completed_lessons_count / total_lessons) * 100 : 0;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Icon mapping
  const renderIcon = () => {
    if (!unlocked) {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    }

    switch (icon_type) {
      case 'chat':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'travel':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 2 8.66a1 1 0 0 0-.02 1.9l6 3.11 3.11 6a1 1 0 0 0 1.9-.02L22 2Z" />
            <path d="M9 13l5.4-5.4" />
          </svg>
        );
      case 'food':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'family':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        );
    }
  };

  const handleNodeClick = () => {
    if (unlocked) {
      setShowPopover(!showPopover);
    }
  };

  return (
    <div className={styles.nodeWrapper} ref={nodeRef}>
      {/* Golden crown indicator if skill completed */}
      {completed && (
        <span className={styles.completedCrown} title="Skill Completed!">
          👑
        </span>
      )}

      {/* SVG Progress Ring surrounding the button */}
      {unlocked && (
        <svg
          height={102}
          width={102}
          className={styles.progressRing}
        >
          <circle
            stroke="var(--color-gray-200)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={51}
            cy={51}
            className={styles.ringBackground}
          />
          <circle
            stroke={colors.main}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={51}
            cy={51}
            className={styles.ringProgress}
          />
        </svg>
      )}

      {/* Main Circular Button */}
      <button
        className={`${styles.circleButton} ${!unlocked ? styles.locked : ''}`}
        onClick={handleNodeClick}
        style={{
          '--node-color': colors.main,
          '--node-dark-color': colors.dark,
          boxShadow: unlocked ? `0 6px 0 ${colors.dark}` : undefined,
        } as React.CSSProperties}
      >
        <div className={styles.innerCircle}>
          {renderIcon()}
        </div>
      </button>

      {/* Popover / Tooltip */}
      {showPopover && unlocked && nextLesson && (
        <div
          className={styles.popover}
          style={{ '--node-color': colors.main } as React.CSSProperties}
        >
          <div>
            <h3 className={styles.popoverTitle}>{title}</h3>
            <p className={styles.popoverDesc}>{description}</p>
          </div>
          
          <div className={styles.popoverProgress}>
            Lesson {completed_lessons_count} / {total_lessons}
          </div>

          <Link
            href={`/lesson/${nextLesson.id}`}
            className="btn-3d btn-gray styles.startBtn"
            style={{
              backgroundColor: '#ffffff',
              color: colors.main,
              boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
              fontWeight: 800,
            }}
          >
            Start +{nextLesson.xp_reward} XP
          </Link>
        </div>
      )}
    </div>
  );
}
