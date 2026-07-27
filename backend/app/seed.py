from sqlalchemy.orm import Session
import json
from app import models

def seed_data(db: Session):
    """
    Cleans database records (excluding custom configurations if needed)
    and seeds all courses, exercises, mock users, and achievements.
    """
    # 1. Clean existing records in dependency order
    db.query(models.UserAchievement).delete()
    db.query(models.UserLessonProgress).delete()
    db.query(models.UserProgress).delete()
    db.query(models.Exercise).delete()
    db.query(models.Lesson).delete()
    db.query(models.Skill).delete()
    db.query(models.Unit).delete()
    db.query(models.Achievement).delete()
    # Keep the user if we want, or clean and rebuild them
    db.query(models.User).delete()
    db.commit()

    # 2. Seed Users
    # Primary logged-in learner
    current_user = models.User(
        id=1,
        username="learner_duo",
        email="learner@duo.com",
        avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=learner_duo",
        streak_count=0,
        xp=0,
        hearts=5,
        gems=500
    )
    db.add(current_user)

    # Competitor profiles for leaderboard
    leaderboard_users = [
        models.User(id=2, username="DuoMascot", email="duo@mascot.com", avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=DuoMascot", streak_count=18, xp=980, hearts=5, gems=800),
        models.User(id=3, username="SpanishPro", email="pro@spanish.com", avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=SpanishPro", streak_count=8, xp=740, hearts=4, gems=650),
        models.User(id=4, username="Polyglot99", email="poly@glot.com", avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=Polyglot", streak_count=5, xp=480, hearts=3, gems=120),
        models.User(id=5, username="AntigravityCoder", email="anti@gravity.com", avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=Antigravity", streak_count=3, xp=320, hearts=5, gems=310),
        models.User(id=6, username="LingoBird", email="lingo@bird.com", avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=LingoBird", streak_count=1, xp=90, hearts=5, gems=100)
    ]
    for u in leaderboard_users:
        db.add(u)

    # 3. Seed Achievements
    achievements = [
        models.Achievement(id=1, name="XP Milestone", description="Earn 100 XP overall to reach this milestone", xp_required=100),
        models.Achievement(id=2, name="Streak Master", description="Gain a 3-day active streak", xp_required=0),
        models.Achievement(id=3, name="Hearts Survivor", description="Earn 50 XP with full hearts", xp_required=50)
    ]
    for a in achievements:
        db.add(a)

    # 4. Seed Course Content
    # --- Unit 1: Form Basic Sentences ---
    u1 = models.Unit(id=1, title="Introduce Yourself", description="Master basic greetings, introduce yourself, and build core travel phrases.", order=1)
    db.add(u1)

    # Skill 1: Greetings
    s1 = models.Skill(id=1, unit_id=1, title="Greetings", description="Say hello and ask how people are doing", order=1, icon_type="chat")
    db.add(s1)

    # Greetings: Lesson 1
    l1_s1 = models.Lesson(id=1, skill_id=1, title="Hello and Goodbye", order=1, xp_reward=15)
    db.add(l1_s1)

    l1_s1_exercises = [
        models.Exercise(
            lesson_id=1,
            type="MULTIPLE_CHOICE",
            prompt="Translate the word: 'Hello'",
            correct_answer="Hola",
            content_json=json.dumps({
                "options": ["Hola", "Adiós", "Gracias", "Por favor"]
            })
        ),
        models.Exercise(
            lesson_id=1,
            type="TRANSLATE",
            prompt="Translate: 'Good morning'",
            correct_answer="Buenos días",
            content_json=json.dumps({
                "word_bank": ["Buenos", "días", "noches", "tardes", "Hola", "adiós"]
            })
        ),
        models.Exercise(
            lesson_id=1,
            type="FILL_IN_BLANK",
            prompt="Complete the greeting: 'Hola, ¿cómo ____ tú?'",
            correct_answer="estás",
            content_json=json.dumps({
                "options": ["estás", "está", "soy", "eres"]
            })
        ),
        models.Exercise(
            lesson_id=1,
            type="MATCH_PAIRS",
            prompt="Match the Spanish words with their English translations",
            correct_answer="hola:hello,adiós:goodbye,gracias:thanks,amigo:friend,buenos días:good morning",
            content_json=json.dumps({
                "pairs": {
                    "hola": "hello",
                    "adiós": "goodbye",
                    "gracias": "thanks",
                    "amigo": "friend",
                    "buenos días": "good morning"
                }
            })
        ),
        models.Exercise(
            lesson_id=1,
            type="TYPE_ANSWER",
            prompt="Translate the sentence into Spanish: 'Hello, how are you?'",
            correct_answer="Hola, ¿cómo estás?",
            content_json=json.dumps({})
        )
    ]
    for ex in l1_s1_exercises:
        db.add(ex)

    # Greetings: Lesson 2
    l2_s1 = models.Lesson(id=2, skill_id=1, title="Introducing Yourself", order=2, xp_reward=15)
    db.add(l2_s1)

    l2_s1_exercises = [
        models.Exercise(
            lesson_id=2,
            type="MULTIPLE_CHOICE",
            prompt="Translate 'My name is Duo'",
            correct_answer="Me llamo Duo",
            content_json=json.dumps({
                "options": ["Me llamo Duo", "Soy de España", "Duo es mi amigo", "Mucho gusto Duo"]
            })
        ),
        models.Exercise(
            lesson_id=2,
            type="TRANSLATE",
            prompt="Translate: 'Nice to meet you'",
            correct_answer="Mucho gusto",
            content_json=json.dumps({
                "word_bank": ["Mucho", "gusto", "gracias", "de", "nada", "hola"]
            })
        ),
        models.Exercise(
            lesson_id=2,
            type="FILL_IN_BLANK",
            prompt="Complete the sentence: 'Yo ____ estudiante.'",
            correct_answer="soy",
            content_json=json.dumps({
                "options": ["soy", "estoy", "tengo", "llamo"]
            })
        ),
        models.Exercise(
            lesson_id=2,
            type="MATCH_PAIRS",
            prompt="Match the pronoun pairs",
            correct_answer="yo:I,tú:you,él:he,ella:she,nosotros:we",
            content_json=json.dumps({
                "pairs": {
                    "yo": "I",
                    "tú": "you",
                    "él": "he",
                    "ella": "she",
                    "nosotros": "we"
                }
            })
        ),
        models.Exercise(
            lesson_id=2,
            type="TYPE_ANSWER",
            prompt="Translate the sentence into Spanish: 'I am from Madrid'",
            correct_answer="Soy de Madrid",
            content_json=json.dumps({})
        )
    ]
    for ex in l2_s1_exercises:
        db.add(ex)

    # Skill 2: Travel
    s2 = models.Skill(id=2, unit_id=1, title="Travel Basics", description="Navigate airports, ask directions, and call a cab", order=2, icon_type="travel")
    db.add(s2)

    # Travel: Lesson 1
    l1_s2 = models.Lesson(id=3, skill_id=2, title="At the Airport", order=1, xp_reward=15)
    db.add(l1_s2)

    l1_s2_exercises = [
        models.Exercise(
            lesson_id=3,
            type="MULTIPLE_CHOICE",
            prompt="Translate the word: 'The passport'",
            correct_answer="El pasaporte",
            content_json=json.dumps({
                "options": ["El pasaporte", "La maleta", "El avión", "El taxi"]
            })
        ),
        models.Exercise(
            lesson_id=3,
            type="TRANSLATE",
            prompt="Translate: 'Where is my suitcase?'",
            correct_answer="¿Dónde está mi maleta?",
            content_json=json.dumps({
                "word_bank": ["¿Dónde", "está", "mi", "maleta?", "avión", "pasaporte", "boleto"]
            })
        ),
        models.Exercise(
            lesson_id=3,
            type="FILL_IN_BLANK",
            prompt="Complete the sentence: 'El ____ va a Madrid.'",
            correct_answer="avión",
            content_json=json.dumps({
                "options": ["avión", "pasaporte", "boleto", "hotel"]
            })
        ),
        models.Exercise(
            lesson_id=3,
            type="MATCH_PAIRS",
            prompt="Match the travel words",
            correct_answer="pasaporte:passport,maleta:suitcase,avión:plane,boleto:ticket,taxi:taxi",
            content_json=json.dumps({
                "pairs": {
                    "pasaporte": "passport",
                    "maleta": "suitcase",
                    "avión": "plane",
                    "boleto": "ticket",
                    "taxi": "taxi"
                }
            })
        ),
        models.Exercise(
            lesson_id=3,
            type="TYPE_ANSWER",
            prompt="Translate: 'My ticket, please'",
            correct_answer="Mi boleto, por favor",
            content_json=json.dumps({})
        )
    ]
    for ex in l1_s2_exercises:
        db.add(ex)

    # --- Unit 2: Get Around Town ---
    u2 = models.Unit(id=2, title="Get Around Town", description="Order food, describe family members, and talk about your home.", order=2)
    db.add(u2)

    # Skill 3: Food
    s3 = models.Skill(id=3, unit_id=2, title="Food & Drinks", description="Order dishes, describe tastes, and settle the restaurant bill", order=1, icon_type="food")
    db.add(s3)

    # Food: Lesson 1
    l1_s3 = models.Lesson(id=4, skill_id=3, title="Ordering Food", order=1, xp_reward=15)
    db.add(l1_s3)

    l1_s3_exercises = [
        models.Exercise(
            lesson_id=4,
            type="MULTIPLE_CHOICE",
            prompt="Translate the phrase: 'A glass of water'",
            correct_answer="Un vaso de agua",
            content_json=json.dumps({
                "options": ["Un vaso de agua", "Una taza de café", "Una cerveza fría", "Un plato de sopa"]
            })
        ),
        models.Exercise(
            lesson_id=4,
            type="TRANSLATE",
            prompt="Translate: 'I want a cheese sandwich'",
            correct_answer="Yo quiero un sándwich de queso",
            content_json=json.dumps({
                "word_bank": ["Yo", "quiero", "un", "sándwich", "de", "queso", "pan", "leche", "jamón"]
            })
        ),
        models.Exercise(
            lesson_id=4,
            type="FILL_IN_BLANK",
            prompt="Complete: 'La ____ por favor.' (The bill, please)",
            correct_answer="cuenta",
            content_json=json.dumps({
                "options": ["cuenta", "comida", "carta", "mesa"]
            })
        ),
        models.Exercise(
            lesson_id=4,
            type="MATCH_PAIRS",
            prompt="Match the food items",
            correct_answer="agua:water,pan:bread,queso:cheese,cuenta:bill,leche:milk",
            content_json=json.dumps({
                "pairs": {
                    "agua": "water",
                    "pan": "bread",
                    "queso": "cheese",
                    "cuenta": "bill",
                    "leche": "milk"
                }
            })
        ),
        models.Exercise(
            lesson_id=4,
            type="TYPE_ANSWER",
            prompt="Translate the restaurant phrase: 'A table for two'",
            correct_answer="Una mesa para dos",
            content_json=json.dumps({})
        )
    ]
    for ex in l1_s3_exercises:
        db.add(ex)

    # Skill 4: Family
    s4 = models.Skill(id=4, unit_id=2, title="Family & Home", description="Introduce your parents, brothers, and describe your room", order=2, icon_type="family")
    db.add(s4)

    # Family: Lesson 1
    l1_s4 = models.Lesson(id=5, skill_id=4, title="Meet the Family", order=1, xp_reward=15)
    db.add(l1_s4)

    l1_s4_exercises = [
        models.Exercise(
            lesson_id=5,
            type="MULTIPLE_CHOICE",
            prompt="Translate the term: 'My brother'",
            correct_answer="Mi hermano",
            content_json=json.dumps({
                "options": ["Mi hermano", "Mi hermana", "Mi madre", "Mi padre"]
            })
        ),
        models.Exercise(
            lesson_id=5,
            type="TRANSLATE",
            prompt="Translate: 'I love my family'",
            correct_answer="Yo amo a mi familia",
            content_json=json.dumps({
                "word_bank": ["Yo", "amo", "a", "mi", "familia", "casa", "hermano", "perro"]
            })
        ),
        models.Exercise(
            lesson_id=5,
            type="FILL_IN_BLANK",
            prompt="Complete the sentence: 'Mi ____ se llama Carmen.'",
            correct_answer="madre",
            content_json=json.dumps({
                "options": ["madre", "padre", "hermano", "hijo"]
            })
        ),
        models.Exercise(
            lesson_id=5,
            type="MATCH_PAIRS",
            prompt="Match the relations",
            correct_answer="madre:mother,padre:father,hermano:brother,hermana:sister,hijo:son",
            content_json=json.dumps({
                "pairs": {
                    "madre": "mother",
                    "padre": "father",
                    "hermano": "brother",
                    "hermana": "sister",
                    "hijo": "son"
                }
            })
        ),
        models.Exercise(
            lesson_id=5,
            type="TYPE_ANSWER",
            prompt="Translate: 'My house is big'",
            correct_answer="Mi casa es grande",
            content_json=json.dumps({})
        )
    ]
    for ex in l1_s4_exercises:
        db.add(ex)

    db.commit()
    print("Database seeding completed successfully.")
