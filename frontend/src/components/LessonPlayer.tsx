'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import styles from './LessonPlayer.module.css';

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

interface LessonPlayerProps {
  lesson: Lesson;
}

export default function LessonPlayer({ lesson }: LessonPlayerProps) {
  const router = useRouter();
  const { user, refreshUser } = useUser();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [heartsRemaining, setHeartsRemaining] = useState(user?.hearts ?? 5);
  const [heartsLostInLesson, setHeartsLostInLesson] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  // User input states
  const [selectedMcOption, setSelectedMcOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [selectedWords, setSelectedWords] = useState<string[]>([]); // Word Bank translate
  
  // Match pairs states
  const [spanishWords, setSpanishWords] = useState<string[]>([]);
  const [englishWords, setEnglishWords] = useState<string[]>([]);
  const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set()); // e.g. "hola:hello"
  const [mismatchSpanish, setMismatchSpanish] = useState<string | null>(null);
  const [mismatchEnglish, setMismatchEnglish] = useState<string | null>(null);

  // Lesson player status: 'idle', 'checked', 'correct', 'incorrect', 'finished', 'failed'
  const [status, setStatus] = useState<'idle' | 'checked' | 'correct' | 'incorrect' | 'finished' | 'failed'>('idle');

  const exercises = lesson.exercises;
  const currentExercise = exercises[currentIdx];

  // Helper function to pronounce Spanish phrases using Web Speech API
  const speakSpanish = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      
      // Find a Spanish voice if available
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Sync user speech trigger on showing new exercises
  useEffect(() => {
    if (currentExercise) {
      // For Spanish translation tasks, read prompt if it's Spanish, or read correct answer
      if (currentExercise.type === 'MULTIPLE_CHOICE' && currentExercise.prompt.includes('Translate')) {
        // Read options or prompt if they are Spanish
      }
      // Trigger voice on load for Translate sentences
      if (currentExercise.type === 'TRANSLATE' || currentExercise.type === 'FILL_IN_BLANK') {
        const textToSpeak = currentExercise.correct_answer;
        // Let's speak correct Spanish answer or prompt if Spanish
        if (currentExercise.prompt.includes("sentence")) {
          // Speak sentence
        }
      }
    }
  }, [currentIdx, currentExercise]);

  // Initializing word pool for word bank translate
  const wordBankPool = useMemo(() => {
    if (!currentExercise || currentExercise.type !== 'TRANSLATE') return [];
    try {
      const content = JSON.parse(currentExercise.content_json);
      return content.word_bank || [];
    } catch {
      return [];
    }
  }, [currentExercise]);

  // Initializing match pairs lists
  useEffect(() => {
    if (!currentExercise || currentExercise.type !== 'MATCH_PAIRS') return;
    try {
      const content = JSON.parse(currentExercise.content_json);
      const pairs = content.pairs as Record<string, string>;
      
      const sp = Object.keys(pairs);
      const en = Object.values(pairs);

      // Shuffle lists
      setSpanishWords([...sp].sort(() => Math.random() - 0.5));
      setEnglishWords([...en].sort(() => Math.random() - 0.5));
      setMatchedPairs(new Set());
      setSelectedSpanish(null);
      setSelectedEnglish(null);
    } catch (e) {
      console.error('Failed to parse match pairs content', e);
    }
  }, [currentExercise]);

  // Handle Match Pairs Click
  const handleSpanishClick = (word: string) => {
    if (status !== 'idle' || isWordMatched(word, 'sp')) return;
    speakSpanish(word);
    setSelectedSpanish(word);
    if (selectedEnglish) {
      checkMatch(word, selectedEnglish);
    }
  };

  const handleEnglishClick = (word: string) => {
    if (status !== 'idle' || isWordMatched(word, 'en')) return;
    setSelectedEnglish(word);
    if (selectedSpanish) {
      checkMatch(selectedSpanish, word);
    }
  };

  const isWordMatched = (word: string, type: 'sp' | 'en') => {
    for (const pair of Array.from(matchedPairs)) {
      const [sp, en] = pair.split(':');
      if (type === 'sp' && sp === word) return true;
      if (type === 'en' && en === word) return true;
    }
    return false;
  };

  const checkMatch = (spWord: string, enWord: string) => {
    try {
      const content = JSON.parse(currentExercise.content_json);
      const pairs = content.pairs as Record<string, string>;

      if (pairs[spWord] === enWord) {
        // Match!
        const newMatched = new Set(matchedPairs);
        newMatched.add(`${spWord}:${enWord}`);
        setMatchedPairs(newMatched);
        setSelectedSpanish(null);
        setSelectedEnglish(null);
      } else {
        // Mismatch - flash red
        setMismatchSpanish(spWord);
        setMismatchEnglish(enWord);
        setSelectedSpanish(null);
        setSelectedEnglish(null);
        setTimeout(() => {
          setMismatchSpanish(null);
          setMismatchEnglish(null);
        }, 800);
      }
    } catch {}
  };

  // Grading Answer normalization helper
  const cleanString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[¿?¡!.,\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Determine if check button should be enabled
  const isAnswerProvided = () => {
    if (currentExercise.type === 'MULTIPLE_CHOICE' || currentExercise.type === 'FILL_IN_BLANK') {
      return selectedMcOption !== null;
    }
    if (currentExercise.type === 'TYPE_ANSWER') {
      return typedAnswer.trim().length > 0;
    }
    if (currentExercise.type === 'TRANSLATE') {
      return selectedWords.length > 0;
    }
    if (currentExercise.type === 'MATCH_PAIRS') {
      // Enabled when all pairs are matched
      try {
        const content = JSON.parse(currentExercise.content_json);
        const pairCount = Object.keys(content.pairs).length;
        return matchedPairs.size === pairCount;
      } catch {
        return false;
      }
    }
    return false;
  };

  // Grade current exercise
  const checkAnswer = () => {
    let isCorrect = false;
    let textToPronounce = '';

    if (currentExercise.type === 'MULTIPLE_CHOICE' || currentExercise.type === 'FILL_IN_BLANK') {
      isCorrect = selectedMcOption === currentExercise.correct_answer;
      if (isCorrect) textToPronounce = currentExercise.correct_answer;
    } else if (currentExercise.type === 'TYPE_ANSWER') {
      isCorrect = cleanString(typedAnswer) === cleanString(currentExercise.correct_answer);
      if (isCorrect) textToPronounce = currentExercise.correct_answer;
    } else if (currentExercise.type === 'TRANSLATE') {
      const assembled = selectedWords.join(' ');
      isCorrect = cleanString(assembled) === cleanString(currentExercise.correct_answer);
      if (isCorrect) textToPronounce = currentExercise.correct_answer;
    } else if (currentExercise.type === 'MATCH_PAIRS') {
      // Match pairs are self-graded as they go, checking match size
      isCorrect = true;
    }

    if (isCorrect) {
      setStatus('correct');
      // Speak correct answer if it's Spanish
      if (textToPronounce) {
        speakSpanish(textToPronounce);
      }
    } else {
      setStatus('incorrect');
      // Lose heart
      const newHearts = Math.max(0, heartsRemaining - 1);
      setHeartsRemaining(newHearts);
      setHeartsLostInLesson(prev => prev + 1);

      if (newHearts === 0) {
        // Fail lesson after verification bar
      }
    }
  };

  // Move to next exercise or complete
  const handleContinue = async () => {
    if (heartsRemaining === 0) {
      setStatus('failed');
      return;
    }

    if (currentIdx + 1 < exercises.length) {
      // Clear states and load next question
      setSelectedMcOption(null);
      setTypedAnswer('');
      setSelectedWords([]);
      setSelectedSpanish(null);
      setSelectedEnglish(null);
      setMatchedPairs(new Set());
      setCurrentIdx(currentIdx + 1);
      setStatus('idle');
    } else {
      // Completed last exercise!
      setXpEarned(lesson.xp_reward);
      setStatus('finished');
    }
  };

  // Submit completion to backend
  const handleFinishLesson = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/lessons/${lesson.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hearts_lost: heartsLostInLesson,
          xp_earned: xpEarned,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save completion progress');
      }

      await refreshUser(); // Update stats context
      router.push('/');    // Go home
    } catch (err: any) {
      alert('Error saving results: ' + err.message);
      router.push('/');
    }
  };

  // Quit and return home
  const handleQuit = () => {
    if (confirm('Are you sure you want to quit this lesson? You will lose any progress from this session.')) {
      router.push('/');
    }
  };

  const progressPercent = ((currentIdx) / exercises.length) * 100;

  return (
    <div className={styles.playerContainer}>
      
      {/* Top Navigation */}
      <div className={styles.topBar}>
        <button onClick={handleQuit} className={styles.closeBtn} title="Quit Lesson">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
        </div>

        <div className={styles.hearts}>
          <span>❤️</span>
          <span>{heartsRemaining}</span>
        </div>
      </div>

      {/* Main Question Panel */}
      {status !== 'finished' && status !== 'failed' && currentExercise && (
        <div className={styles.contentArea}>
          
          <div className={styles.prompt}>
            {currentExercise.prompt}
          </div>

          {/* Playful Mascot speech bubbles for translating / MC */}
          {(currentExercise.type === 'TRANSLATE' || currentExercise.type === 'MULTIPLE_CHOICE') && (
            <div className={styles.characterBubble}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#58cc02"/>
                <circle cx="14" cy="18" r="7" fill="white"/>
                <circle cx="14" cy="18" r="3" fill="#3c3c3c"/>
                <circle cx="26" cy="18" r="7" fill="white"/>
                <circle cx="26" cy="18" r="3" fill="#3c3c3c"/>
                <path d="M20 22L17 26H23L20 22Z" fill="#ff9600"/>
              </svg>
              <div className={styles.speechBubble}>
                {currentExercise.type === 'TRANSLATE' ? 'Translate this sentence:' : 'Choose the correct option:'}
                <button 
                  onClick={() => speakSpanish(currentExercise.type === 'TRANSLATE' ? currentExercise.correct_answer : currentExercise.prompt)} 
                  className={styles.speakBtn}
                  title="Listen Pronunciation"
                >
                  🔊
                </button>
              </div>
            </div>
          )}

          {/* Exercise Specific Elements */}
          {/* 1. Multiple Choice */}
          {currentExercise.type === 'MULTIPLE_CHOICE' && (() => {
            try {
              const options = JSON.parse(currentExercise.content_json).options as string[];
              return (
                <div className={styles.mcGrid}>
                  {options.map((opt, i) => (
                    <button
                      key={opt}
                      disabled={status !== 'idle'}
                      className={`${styles.mcCard} ${selectedMcOption === opt ? styles.mcSelected : ''}`}
                      onClick={() => {
                        setSelectedMcOption(opt);
                        speakSpanish(opt);
                      }}
                    >
                      <span className={styles.mcIndex}>{i + 1}</span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              );
            } catch {
              return <p>Error rendering options</p>;
            }
          })()}

          {/* 2. Type Answer */}
          {currentExercise.type === 'TYPE_ANSWER' && (
            <div>
              <textarea
                disabled={status !== 'idle'}
                className={styles.textInput}
                placeholder="Type your translation here..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
              />
            </div>
          )}

          {/* 3. Word Bank Translate */}
          {currentExercise.type === 'TRANSLATE' && (
            <div>
              {/* Assembled Area */}
              <div className={styles.assemblyPool}>
                {selectedWords.map((word, idx) => (
                  <button
                    key={idx}
                    disabled={status !== 'idle'}
                    className={styles.wordToken}
                    onClick={() => {
                      // Remove word token
                      setSelectedWords(selectedWords.filter((_, i) => i !== idx));
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>

              {/* Pool of choices */}
              <div className={styles.wordPool}>
                {wordBankPool.map((word: string, idx: number) => {
                  // Check if this token instance is selected
                  // Count appearances in selectedWords vs. occurrences in pool
                  const selectedCount = selectedWords.filter(w => w === word).length;
                  const poolOccurrences = wordBankPool.filter((w: string) => w === word).length;
                  
                  // Simple occurrences index checking to disable word token
                  const instanceIndex = wordBankPool.slice(0, idx + 1).filter((w: string) => w === word).length;
                  const isUsed = instanceIndex <= selectedCount;

                  return (
                    <button
                      key={idx}
                      disabled={status !== 'idle' || isUsed}
                      className={`${styles.wordToken} ${isUsed ? styles.wordDisabled : ''}`}
                      onClick={() => {
                        setSelectedWords([...selectedWords, word]);
                        speakSpanish(word);
                      }}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Fill in Blank */}
          {currentExercise.type === 'FILL_IN_BLANK' && (() => {
            try {
              const options = JSON.parse(currentExercise.content_json).options as string[];
              return (
                <div className={styles.mcGrid}>
                  {options.map((opt, i) => (
                    <button
                      key={opt}
                      disabled={status !== 'idle'}
                      className={`${styles.mcCard} ${selectedMcOption === opt ? styles.mcSelected : ''}`}
                      onClick={() => {
                        setSelectedMcOption(opt);
                        speakSpanish(opt);
                      }}
                    >
                      <span className={styles.mcIndex}>{i + 1}</span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              );
            } catch {
              return <p>Error rendering blank options</p>;
            }
          })()}

          {/* 5. Match Pairs */}
          {currentExercise.type === 'MATCH_PAIRS' && (
            <div className={styles.matchGrid}>
              {/* Spanish Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {spanishWords.map((word) => {
                  const isMatched = isWordMatched(word, 'sp');
                  const isSel = selectedSpanish === word;
                  const isFail = mismatchSpanish === word;

                  return (
                    <button
                      key={word}
                      disabled={status !== 'idle' || isMatched}
                      onClick={() => handleSpanishClick(word)}
                      className={`${styles.matchCard} 
                        ${isSel ? styles.matchSelected : ''} 
                        ${isMatched ? styles.matchCorrect : ''}
                        ${isFail ? styles.matchIncorrect : ''}
                      `}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              {/* English Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {englishWords.map((word) => {
                  const isMatched = isWordMatched(word, 'en');
                  const isSel = selectedEnglish === word;
                  const isFail = mismatchEnglish === word;

                  return (
                    <button
                      key={word}
                      disabled={status !== 'idle' || isMatched}
                      onClick={() => handleEnglishClick(word)}
                      className={`${styles.matchCard} 
                        ${isSel ? styles.matchSelected : ''} 
                        ${isMatched ? styles.matchCorrect : ''}
                        ${isFail ? styles.matchIncorrect : ''}
                      `}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Bottom Grading / Feedback Bar */}
      {status !== 'finished' && status !== 'failed' && (
        <div className={`
          ${styles.feedbackPanel} 
          ${status === 'correct' ? styles.correctPanel : ''} 
          ${status === 'incorrect' ? styles.incorrectPanel : ''}
        `}>
          <div className={styles.feedbackContent}>
            
            {/* Status explanation */}
            <div className={styles.feedbackText}>
              {status === 'correct' && (
                <>
                  <div className={styles.feedbackIcon}>✔️</div>
                  <div>
                    <h4 className={styles.feedbackTitle}>Excellent! You got it right.</h4>
                  </div>
                </>
              )}

              {status === 'incorrect' && (
                <>
                  <div className={styles.feedbackIcon}>❌</div>
                  <div>
                    <h4 className={styles.feedbackTitle}>Incorrect solution</h4>
                    <p className={styles.feedbackDetail}>Correct answer: {currentExercise?.correct_answer}</p>
                  </div>
                </>
              )}

              {status === 'idle' && (
                <div style={{ color: 'var(--color-gray-500)', fontWeight: 600 }}>
                  Select or type the translation to check your response.
                </div>
              )}
            </div>

            {/* Main CTA */}
            {status === 'idle' ? (
              <button
                disabled={!isAnswerProvided()}
                onClick={checkAnswer}
                className="btn-3d btn-green"
                style={{ width: '150px' }}
              >
                Check
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className={`btn-3d ${status === 'correct' ? 'btn-green' : 'btn-pink'}`}
                style={{ width: '150px' }}
              >
                Continue
              </button>
            )}

          </div>
        </div>
      )}

      {/* Success Completion Dialog Modal */}
      {status === 'finished' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ fontSize: '64px' }}>🎉</div>
            <h1 className={`${styles.modalTitle} ${styles.successColor}`}>Lesson Complete!</h1>
            <p>You completed the lesson and showed great progress! Keep it up!</p>
            
            <div className={styles.modalStats}>
              <div className={styles.statCard}>
                <span className={styles.statVal}>+{xpEarned}</span>
                <span className={styles.statLbl}>XP Earned</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal} style={{ color: 'var(--color-pink)' }}>{5 - heartsRemaining}</span>
                <span className={styles.statLbl}>Hearts Lost</span>
              </div>
            </div>

            <button onClick={handleFinishLesson} className="btn-3d btn-green" style={{ width: '100%' }}>
              Continue to Home
            </button>
          </div>
        </div>
      )}

      {/* Failed out of Hearts Modal */}
      {status === 'failed' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ fontSize: '64px' }}>💔</div>
            <h1 className={`${styles.modalTitle} ${styles.failureColor}`}>No Hearts Left</h1>
            <p>You lost all your hearts in this lesson. Refill them in the shop or complete practice sets to continue learning!</p>
            
            <button onClick={() => router.push('/')} className="btn-3d btn-pink" style={{ width: '100%' }}>
              Return to Path
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
