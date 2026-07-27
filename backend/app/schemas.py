from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# --- Exercise Schemas ---
class ExerciseBase(BaseModel):
    type: str
    prompt: str
    correct_answer: str
    content_json: str

class ExerciseResponse(BaseModel):
    id: int
    lesson_id: int
    type: str
    prompt: str
    correct_answer: str
    content_json: str

    class Config:
        from_attributes = True

# --- Lesson Schemas ---
class LessonBase(BaseModel):
    title: str
    order: int
    xp_reward: int

class LessonResponse(BaseModel):
    id: int
    skill_id: int
    title: str
    order: int
    xp_reward: int
    exercises: List[ExerciseResponse] = []

    class Config:
        from_attributes = True

class LessonProgressResponse(BaseModel):
    id: int
    title: str
    order: int
    xp_reward: int
    completed: bool

    class Config:
        from_attributes = True

# --- Skill Schemas ---
class SkillBase(BaseModel):
    title: str
    description: str
    order: int
    icon_type: str

class SkillResponse(BaseModel):
    id: int
    unit_id: int
    title: str
    description: str
    order: int
    icon_type: str
    lessons: List[LessonProgressResponse] = []
    
    # Progress fields computed per-user
    completed: bool = False
    current_lesson_order: int = 1
    total_lessons: int = 0
    completed_lessons_count: int = 0
    unlocked: bool = False

    class Config:
        from_attributes = True

# --- Unit Schemas ---
class UnitBase(BaseModel):
    title: str
    description: str
    order: int

class UnitResponse(BaseModel):
    id: int
    title: str
    description: str
    order: int
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True

# --- User & Progress Schemas ---
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    streak_count: int
    last_active_date: Optional[datetime] = None
    xp: int
    hearts: int
    last_heart_loss: Optional[datetime] = None
    gems: int
    
    # Calculated fields
    next_heart_regenerate_in_seconds: Optional[int] = None

    class Config:
        from_attributes = True

# --- Leaderboard Schema ---
class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    xp: int
    streak_count: int
    avatar_url: Optional[str] = None
    is_current_user: bool = False

# --- Achievement Schemas ---
class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    xp_required: int
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None

# --- Request / Action Payload Schemas ---
class LessonCompleteRequest(BaseModel):
    hearts_lost: int = Field(..., ge=0, le=5)
    xp_earned: int = Field(..., gt=0)

class HeartRefillRequest(BaseModel):
    refill_type: str = Field(..., pattern="^(gems|practice)$")  # gems or practice
