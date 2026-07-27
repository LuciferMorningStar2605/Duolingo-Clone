from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    
    # Gamification
    streak_count = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)
    xp = Column(Integer, default=0)
    hearts = Column(Integer, default=5)
    last_heart_loss = Column(DateTime, nullable=True)
    gems = Column(Integer, default=500)

    # Relationships
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    lesson_progress = relationship("UserLessonProgress", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    order = Column(Integer, nullable=False)

    # Relationships
    skills = relationship("Skill", back_populates="unit", cascade="all, delete-orphan", order_by="Skill.order")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    order = Column(Integer, nullable=False)
    icon_type = Column(String, default="chat")  # icon visual cue e.g. "chat", "travel", "food"

    # Relationships
    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill", cascade="all, delete-orphan", order_by="Lesson.order")
    user_progress = relationship("UserProgress", back_populates="skill", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    title = Column(String, nullable=False)
    order = Column(Integer, nullable=False)
    xp_reward = Column(Integer, default=15)

    # Relationships
    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", cascade="all, delete-orphan", order_by="Exercise.id")
    user_progress_logs = relationship("UserLessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    type = Column(String, nullable=False)  # MULTIPLE_CHOICE, TRANSLATE, MATCH_PAIRS, FILL_IN_BLANK, TYPE_ANSWER
    prompt = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)
    content_json = Column(String, nullable=False)  # JSON-string with prompt options, translations, word bank etc.

    # Relationships
    lesson = relationship("Lesson", back_populates="exercises")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    completed = Column(Boolean, default=False)
    current_lesson_order = Column(Integer, default=1)  # tracks next lesson index to take in this skill

    # Relationships
    user = relationship("User", back_populates="progress")
    skill = relationship("Skill", back_populates="user_progress")


class UserLessonProgress(Base):
    __tablename__ = "user_lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    completed_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="user_progress_logs")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    xp_required = Column(Integer, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    unlocked_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")
