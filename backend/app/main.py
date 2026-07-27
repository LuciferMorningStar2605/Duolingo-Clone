from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud
from app.database import engine, SessionLocal, Base, get_db
from app.seed import seed_data

# Create SQLite database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
db = SessionLocal()
try:
    if not db.query(models.User).filter(models.User.username == "learner_duo").first():
        print("No default user found. Seeding the database automatically...")
        seed_data(db)
finally:
    db.close()

app = FastAPI(
    title="Duolingo Clone API",
    description="SDE Fullstack Assignment - Duolingo Gamification Engine API",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_USER_ID = 1  # Simplified: assume this single user is logged in for the assignment

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Duolingo Clone API!",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Duolingo Clone Backend"}

# --- Seed trigger (in case manual refresh is desired) ---
@app.post("/api/seed", status_code=status.HTTP_200_OK)
def trigger_seed(db: Session = Depends(get_db)):
    try:
        seed_data(db)
        return {"message": "Database seeded successfully!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Seeding failed: {str(e)}"
        )

# --- User Profile Endpoints ---
@app.get("/api/users/profile", response_model=schemas.UserResponse)
def get_user_profile(db: Session = Depends(get_db)):
    user = crud.get_user(db, DEFAULT_USER_ID)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found"
        )
    
    # Map calculated fields
    response = schemas.UserResponse.from_orm(user)
    response.next_heart_regenerate_in_seconds = crud.get_seconds_until_next_heart(user)
    return response

@app.post("/api/users/refill-hearts", response_model=schemas.UserResponse)
def refill_user_hearts(payload: schemas.HeartRefillRequest, db: Session = Depends(get_db)):
    user = crud.get_user(db, DEFAULT_USER_ID)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found"
        )
    
    try:
        updated_user = crud.refill_hearts(db, user, payload.refill_type)
        response = schemas.UserResponse.from_orm(updated_user)
        response.next_heart_regenerate_in_seconds = crud.get_seconds_until_next_heart(updated_user)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/api/users/reset", response_model=schemas.UserResponse)
def reset_progress(db: Session = Depends(get_db)):
    try:
        # Reset progress to baseline
        updated_user = crud.reset_user_progress(db, DEFAULT_USER_ID)
        response = schemas.UserResponse.from_orm(updated_user)
        response.next_heart_regenerate_in_seconds = None
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

# --- Course Path / Skill Tree Endpoints ---
@app.get("/api/course/path", response_model=List[schemas.UnitResponse])
def get_course_path(db: Session = Depends(get_db)):
    units = crud.get_learning_path(db, DEFAULT_USER_ID)
    return units

# --- Lesson Endpoints ---
@app.get("/api/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = crud.get_lesson_with_exercises(db, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    return lesson

@app.post("/api/lessons/{lesson_id}/complete", response_model=schemas.UserResponse)
def submit_lesson_completion(lesson_id: int, payload: schemas.LessonCompleteRequest, db: Session = Depends(get_db)):
    try:
        updated_user = crud.complete_lesson(db, DEFAULT_USER_ID, lesson_id, payload)
        response = schemas.UserResponse.from_orm(updated_user)
        response.next_heart_regenerate_in_seconds = crud.get_seconds_until_next_heart(updated_user)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# --- Leaderboard & Achievement Endpoints ---
@app.get("/api/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard_standings(db: Session = Depends(get_db)):
    return crud.get_leaderboard(db, DEFAULT_USER_ID)

@app.get("/api/achievements", response_model=List[schemas.AchievementResponse])
def get_achievements_list(db: Session = Depends(get_db)):
    return crud.get_user_achievements(db, DEFAULT_USER_ID)
