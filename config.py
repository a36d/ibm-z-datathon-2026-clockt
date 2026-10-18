"""
Clockt backend configuration.

Environment variables allow Clockt to run in different
environments without changing the source code.
"""

import os
from pathlib import Path


# Application information
APP_NAME = "Clockt"
API_VERSION = "v1"


# Backend network configuration
HOST = os.getenv("CLOCKT_HOST", "127.0.0.1")
PORT = int(os.getenv("CLOCKT_PORT", "8000"))


# Project directories
BASE_DIR = Path(__file__).resolve().parent


# Database configuration
DATABASE_PATH = Path(
    os.getenv(
        "CLOCKT_DATABASE_PATH",
        str(BASE_DIR / "clockt.db")
    )
)


# AI configuration
MODEL_NAME = os.getenv(
    "CLOCKT_MODEL_NAME",
    "HuggingFaceTB/SmolLM2-360M-Instruct"
)