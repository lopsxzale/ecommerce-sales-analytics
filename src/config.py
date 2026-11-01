"""Caminhos e conexão com o banco, compartilhados por todo o pipeline."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import Engine, create_engine

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
SQL_DIR = ROOT / "sql"
ANALYSIS_DIR = SQL_DIR / "analysis"
WEB_DATA_DIR = ROOT / "web" / "src" / "data"

load_dotenv(ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://olist:olist@localhost:5433/olist")


def get_engine() -> Engine:
    return create_engine(DATABASE_URL)
