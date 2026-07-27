from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import Optional, List
import json

from app import models, schemas

# Helper to calculate heart regeneration
def refresh_hearts_logic(user: models.User, db: Session) -> models.User:
    """
    Time-based heart regeneration.
    Regenerates 1 heart every 15 minutes (900 seconds) up to a max of 5.
    """
    if user.hearts >= 5:
        user.last_heart_loss = None
        db.commit()
        return user

    if user.last_heart_loss is None:
        # If hearts are less than 5 but last_heart_loss is somehow null, set it to now
        user.last_heart_loss = datetime.utcnow()
        db.commit()
        return user

    elapsed_seconds = (datetime.utcnow() - user.last_heart_loss).total_seconds()
    hearts_to_add = int(elapsed_seconds // 900)

    if hearts_to_add > 0:
        user.hearts = min(5, user.hearts + hearts_to_add)
        if user.hearts == 5:
            user.last_heart_loss = None
        else:
            # Shift the last_heart_loss timestamp forward by the consumed chunks of 900s
            user.last_heart_loss = user.last_heart_loss + timedelta(seconds=hearts_to_add * 900)
        db.commit()
        db.refresh(user)

    return user

def get_seconds_until_next_heart(user: models.User) -> Optional[int]:
    """
    Returns seconds remaining until the next heart regenerates.
    """
    if user.hearts >= 5 or not user.last_heart_loss:
        return None
    
    elapsed_seconds = (datetime.utcnow() - user.last_heart_loss).total_seconds()
    remaining = 900 - (elapsed_seconds % 900)
    return int(remaining)

# --- User CRUD ---
def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        user = refresh_hearts_logic(user, db)
    return user

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user = refresh_hearts_logic(user, db)
    return user

def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        avatar_url=f"https://api.dicebear.com/7.x/adventurer/svg?seed={user_in.username}",
        streak_count=0,
        xp=0,
        hearts=5,
        gems=500
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def refill_hearts(db: Session, user: models.User, refill_type: str) -> models.User:
    """
    Refill hearts.
    - 'gems': Spend 150 gems to fully restore hearts to 5.
    - 'practice': Complete a practice lesson to gain 1 heart.
    """
    user = refresh_hearts_logic(user, db)
    
    if refill_type == "gems":
        if user.gems >= 150:
            user.gems -= 150
            user.hearts = 5
            user.last_heart_loss = None
        else:
            raise ValueError("Insufficient gems")
    elif refill_type == "practice":
        if user.hearts < 5:
            user.hearts += 1
            if user.hearts == 5:
                user.last_heart_loss = None
            # Do not change gems for practice
    
    db.commit()
    db.refresh(user)
    check_and_award_achievements(db, user.id)
    return user

def reset_user_progress(db: Session, user_id: int) -> models.User:
    """
    Resets all user statistics, completed lessons, achievements, and course progress for testing.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
        
    user.xp = 0
    user.streak_count = 0
    user.hearts = 5
    user.gems = 500
    user.last_active_date = None
    user.last_heart_loss = None

    # Delete progress
    db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).delete()
    db.query(models.UserLessonProgress).filter(models.UserLessonProgress.user_id == user_id).delete()
    db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).delete()
    
    db.commit()
    db.refresh(user)
    return user

# --- Learning Path CRUD ---
def get_learning_path(db: Session, user_id: int) -> List[models.Unit]:
    """
    Fetches the skill tree (units, skills, lessons) and maps the user's progress.
    Determines completion percentages, locked states, etc.
    """
    units = db.query(models.Unit).order_by(models.Unit.order).all()
    user_progress = {p.skill_id: p for p in db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()}

    # Tracks if the previous skill was completed. The first skill is always unlocked.
    previous_skill_completed = True

    for unit in units:
        for skill in unit.skills:
            progress = user_progress.get(skill.id)
            
            # Map basic progress data
            if progress:
                skill.completed = progress.completed
                skill.current_lesson_order = progress.current_lesson_order
            else:
                skill.completed = False
                skill.current_lesson_order = 1

            skill.total_lessons = len(skill.lessons)
            
            # Count how many lessons are actually completed
            # If skill.completed is true, completed count is total_lessons.
            # Otherwise, it's (current_lesson_order - 1).
            if skill.completed:
                skill.completed_lessons_count = skill.total_lessons
            else:
                # bound check
                skill.completed_lessons_count = min(skill.total_lessons, max(0, skill.current_lesson_order - 1))

            # Store computed attributes directly onto SQLAlchemy models
            # (FastAPI will read them in the schemas.py properties)
            # Define locked/unlocked state
            # If the user completed the previous skill, this one is unlocked.
            skill.unlocked = previous_skill_completed
            
            # Update previous_skill_completed tracker
            previous_skill_completed = skill.completed

            # Now enrich lessons with individual completed indicators
            # A lesson is completed if its order is less than current_lesson_order (or if the skill is completed)
            for lesson in skill.lessons:
                lesson.completed = skill.completed or (lesson.order < skill.current_lesson_order)

    return units

def get_lesson_with_exercises(db: Session, lesson_id: int) -> Optional[models.Lesson]:
    return db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()

# --- Lesson Completion CRUD ---
def complete_lesson(db: Session, user_id: int, lesson_id: int, payload: schemas.LessonCompleteRequest) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise ValueError("Lesson not found")

    user = refresh_hearts_logic(user, db)

    # 1. Update Hearts
    if payload.hearts_lost > 0:
        # Deduct hearts
        if user.hearts >= 5:
            user.last_heart_loss = datetime.utcnow()
        user.hearts = max(0, user.hearts - payload.hearts_lost)
    
    # 2. Credit XP and Gems
    user.xp += payload.xp_earned
    # Award gems on successful completion (e.g., 10 gems per lesson)
    if user.hearts > 0:
         user.gems += 15

    # 3. Update Streak
    today = datetime.utcnow().date()
    if not user.last_active_date:
        user.streak_count = 1
    else:
        last_active = user.last_active_date.date()
        delta = (today - last_active).days
        if delta == 1:
            user.streak_count += 1
        elif delta > 1:
            user.streak_count = 1  # Reset streak if they skipped a day
        # If delta == 0, they were active today already, streak remains unchanged

    user.last_active_date = datetime.utcnow()

    # 4. Save Lesson Progress Log
    lesson_progress = models.UserLessonProgress(user_id=user_id, lesson_id=lesson_id)
    db.add(lesson_progress)

    # 5. Update Skill tree progress
    skill = lesson.skill
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.skill_id == skill.id
    ).first()

    if not progress:
        progress = models.UserProgress(user_id=user_id, skill_id=skill.id, completed=False, current_lesson_order=1)
        db.add(progress)

    # If completed lesson matches or exceeds current lesson tracker
    if lesson.order >= progress.current_lesson_order:
        progress.current_lesson_order = lesson.order + 1
        
        # Check if they finished the last lesson of the skill
        total_lessons = db.query(models.Lesson).filter(models.Lesson.skill_id == skill.id).count()
        if progress.current_lesson_order > total_lessons:
            progress.completed = True

    db.commit()
    db.refresh(user)

    # 6. Evaluate and Unlock Achievements
    check_and_award_achievements(db, user_id)

    return user

# --- Achievements CRUD ---
def check_and_award_achievements(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return

    # Fetch all achievements
    achievements = db.query(models.Achievement).all()
    # Fetch earned achievement IDs
    earned_ids = {a.achievement_id for a in db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).all()}

    for achievement in achievements:
        if achievement.id in earned_ids:
            continue
        
        should_unlock = False
        # Evaluation check based on name/description triggers
        if achievement.name == "XP Milestone" and user.xp >= achievement.xp_required:
            should_unlock = True
        elif achievement.name == "Streak Master" and user.streak_count >= 3: # 3 days streak
            should_unlock = True
        elif achievement.name == "Hearts Survivor" and user.hearts == 5:
            # Let's say unlocked if they hit 5 hearts while having at least 100 XP
            if user.xp >= 50:
                should_unlock = True

        if should_unlock:
            new_unlock = models.UserAchievement(user_id=user_id, achievement_id=achievement.id)
            db.add(new_unlock)
            
            # Award reward gems for achievements
            user.gems += 50
    
    db.commit()

def get_user_achievements(db: Session, user_id: int) -> List[schemas.AchievementResponse]:
    achievements = db.query(models.Achievement).all()
    user_achievements = {a.achievement_id: a for a in db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).all()}
    
    response = []
    for ach in achievements:
        earned = ach.id in user_achievements
        unlocked_at = user_achievements[ach.id].unlocked_at if earned else None
        response.append(schemas.AchievementResponse(
            id=ach.id,
            name=ach.name,
            description=ach.description,
            xp_required=ach.xp_required,
            unlocked=earned,
            unlocked_at=unlocked_at
        ))
    return response

# --- Leaderboard CRUD ---
def get_leaderboard(db: Session, current_user_id: int) -> List[schemas.LeaderboardEntry]:
    """
    Get user ranking ordered by XP.
    Includes both the main user and seeded users.
    """
    users = db.query(models.User).order_by(desc(models.User.xp)).all()
    
    leaderboard = []
    for rank, u in enumerate(users, start=1):
        leaderboard.append(schemas.LeaderboardEntry(
            rank=rank,
            username=u.username,
            xp=u.xp,
            streak_count=u.streak_count,
            avatar_url=u.avatar_url,
            is_current_user=(u.id == current_user_id)
        ))
    return leaderboard
