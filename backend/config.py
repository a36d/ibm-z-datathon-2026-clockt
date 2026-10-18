
import os
import sys
from pathlib import Path

APP_NAME = "Clockt"
API_VERSION = "v1"

HOST = os.getenv("CLOCKT_HOST", "127.0.0.1")
PORT = int(os.getenv("CLOCKT_PORT", "8000"))

# Directory containing application resources.
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent

# Store user data outside the application installation directory.
if os.name == "nt":
    DATA_DIR = Path(
        os.getenv("LOCALAPPDATA", str(Path.home() / "AppData" / "Local"))
    ) / APP_NAME
else:
    DATA_DIR = Path.home() / ".local" / "share" / APP_NAME

DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = Path(
    os.getenv("CLOCKT_DATABASE_PATH", str(DATA_DIR / "clockt.db"))
)

# Prefer a bundled model when available.
BUNDLED_MODEL_DIR = BASE_DIR / "models" / "SmolLM2-360M-Instruct"

MODEL_NAME = os.getenv(
    "CLOCKT_MODEL_NAME",
    str(BUNDLED_MODEL_DIR)
    if BUNDLED_MODEL_DIR.is_dir()
    else "HuggingFaceTB/SmolLM2-360M-Instruct",
)
