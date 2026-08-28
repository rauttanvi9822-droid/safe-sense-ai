#!/usr/bin/env python3
"""
SafeSense AI — Backend setup script
Creates virtual environment, installs dependencies, and seeds the database.
"""
import subprocess
import sys
import os

def run(cmd, check=True):
    print(f"\n>>> {cmd}")
    return subprocess.run(cmd, shell=True, check=check)

def main():
    print("=" * 60)
    print("SafeSense AI — Backend Setup")
    print("=" * 60)

    # 1. Create virtual environment
    if not os.path.exists("venv"):
        print("\n[1/4] Creating Python virtual environment...")
        run(f"{sys.executable} -m venv venv")
    else:
        print("\n[1/4] Virtual environment already exists.")

    # 2. Determine pip path
    if sys.platform == "win32":
        pip = "venv\\Scripts\\pip"
        python = "venv\\Scripts\\python"
    else:
        pip = "venv/bin/pip"
        python = "venv/bin/python"

    # 3. Install dependencies
    print("\n[2/4] Installing Python dependencies...")
    run(f"{pip} install --upgrade pip")
    run(f"{pip} install -r backend/requirements.txt")

    # 4. Download NLTK data
    print("\n[3/4] Downloading NLTK data...")
    run(f'{python} -c "import nltk; nltk.download(\'punkt\', quiet=True); nltk.download(\'stopwords\', quiet=True); nltk.download(\'punkt_tab\', quiet=True)"', check=False)

    # 5. Instructions
    print("\n[4/4] Setup complete!")
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("\n1. Start PostgreSQL and create the database:")
    print("   createdb safesense_db")
    print("   createuser safesense --pwprompt")
    print("   (or use: docker-compose up db)")
    print("\n2. Copy and configure environment variables:")
    print("   cp .env.example .env")
    print("   (edit .env with your DATABASE_URL and SECRET_KEY)")
    print("\n3. Start the backend:")
    if sys.platform == "win32":
        print("   venv\\Scripts\\uvicorn backend.main:app --reload --port 8000")
    else:
        print("   venv/bin/uvicorn backend.main:app --reload --port 8000")
    print("\n4. Start the frontend (in another terminal):")
    print("   npm run dev")
    print("\n5. Open: http://localhost:5173")
    print("\nAPI docs: http://localhost:8000/api/docs")
    print("=" * 60)

if __name__ == "__main__":
    main()
