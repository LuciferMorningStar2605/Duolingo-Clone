import sys
import os

# Append the parent directory to the path so Vercel can locate the app package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
