"""Cria o schema e carrega os CSVs brutos no PostgreSQL via COPY.

Idempotente: o schema.sql recria as tabelas, então rodar de novo produz o mesmo estado.
"""

import io
import json
from dataclasses import dataclass, field

import pandas as pd

from src.config import PROCESSED_DIR, RAW_DIR, SQL_DIR, get_engine


@dataclass
class TableSpec:
    table: str
    filename: str
    rename: dict[str, str] = field(default_factory=dict)
    dedupe_on: list[str] | None = None


# Ordem respeita as foreign keys.
TABLES = [
    TableSpec("category_translation", "product_category_name_translation.csv"),
    TableSpec("customers", "olist_customers_dataset.csv"),
    TableSpec("sellers", "olist_sellers_dataset.csv"),
    TableSpec(
        "products",
        "olist_products_dataset.csv",
        # Corrige o erro de digitação ("lenght") do dataset original.
        rename={
            "product_name_lenght": "product_name_length",
            "product_description_lenght": "product_description_length",
        },
    ),
    TableSpec("orders", "olist_orders_dataset.csv"),
    TableSpec("order_items", "olist_order_items_dataset.csv"),
    TableSpec("order_payments", "olist_order_payments_dataset.csv"),
    TableSpec(
        "order_reviews",
        "olist_order_reviews_dataset.csv",
        dedupe_on=["review_id", "order_id"],
    ),
    TableSpec("geolocation", "olist_geolocation_dataset.csv"),
]


def read_raw(spec: TableSpec) -> tuple[pd.DataFrame, int]:
    """Lê o CSV como texto (preserva zeros à esquerda dos CEPs) e aplica limpezas."""
    df = pd.read_csv(RAW_DIR / spec.filename, dtype=str, encoding="utf-8-sig")
    raw_rows = len(df)
    df = df.rename(columns=spec.rename)
    if spec.dedupe_on:
        df = df.drop_duplicates(subset=spec.dedupe_on, keep="last")
    return df, raw_rows


def copy_frame(cursor, table: str, df: pd.DataFrame) -> None:
    buffer = io.StringIO()
    df.to_csv(buffer, index=False, header=False)
    buffer.seek(0)
    columns = ", ".join(df.columns)
    cursor.copy_expert(f"COPY {table} ({columns}) FROM STDIN WITH (FORMAT csv)", buffer)


def load() -> dict[str, dict[str, int]]:
    engine = get_engine()
    report: dict[str, dict[str, int]] = {}

    raw = engine.raw_connection()
    try:
        with raw.cursor() as cur:
            cur.execute((SQL_DIR / "schema.sql").read_text(encoding="utf-8"))
            for spec in TABLES:
                df, raw_rows = read_raw(spec)
                copy_frame(cur, spec.table, df)
                report[spec.table] = {"raw_rows": raw_rows, "loaded_rows": len(df)}
                print(f"  {spec.table:<22} {len(df):>9,} linhas")
        raw.commit()
    finally:
        raw.close()

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    (PROCESSED_DIR / "load_report.json").write_text(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    load()
