"""Roda as análises e grava os JSONs consumidos pelo site em web/src/data/.

Os JSONs são versionados: o site é publicado sem precisar de banco.
"""

import json
import math
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import Engine, text

from src import quality, rfm, stats
from src.config import ANALYSIS_DIR, PROCESSED_DIR, SQL_DIR, WEB_DATA_DIR

# Taxa de reativação hipotética usada no cenário de impacto do RFM.
REACTIVATION_RATE = 0.10


def _json_default(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(f"Tipo não serializável: {type(value)}")


def _clean(value):
    """Troca NaN por None para gerar JSON válido."""
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def records(df: pd.DataFrame) -> list[dict]:
    return [{k: _clean(v) for k, v in row.items()} for row in df.to_dict("records")]


def query(engine: Engine, path: Path) -> pd.DataFrame:
    with engine.connect() as conn:
        df = pd.read_sql(text(path.read_text(encoding="utf-8")), conn)
    # NUMERIC do Postgres chega como Decimal; o site só precisa de float.
    for col in df.columns:
        if df[col].map(lambda v: isinstance(v, Decimal)).any():
            df[col] = df[col].astype(float)
    return df


def analysis(engine: Engine, name: str) -> pd.DataFrame:
    return query(engine, ANALYSIS_DIR / f"{name}.sql")


def write(name: str, payload) -> None:
    path = WEB_DATA_DIR / f"{name}.json"
    path.write_text(
        json.dumps(payload, default=_json_default, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"  -> {path.relative_to(WEB_DATA_DIR.parent.parent.parent)}")


def export(engine: Engine) -> None:
    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

    customers = analysis(engine, "04_rfm_base")
    scored = rfm.score(customers)
    segments = rfm.summarize(scored)
    repeat_rate = rfm.repeat_rate(customers)

    kpis = records(analysis(engine, "00_kpis"))[0]
    kpis["repeat_rate"] = repeat_rate
    write("kpis", kpis)

    scores = query(engine, SQL_DIR / "support" / "notas_por_pedido.sql")
    write(
        "delivery_review",
        {
            "buckets": records(analysis(engine, "01_atraso_vs_review")),
            "stats": stats.late_vs_on_time(scores),
        },
    )

    write(
        "revenue",
        {
            "states": records(analysis(engine, "02a_receita_por_estado")),
            "categories": records(analysis(engine, "02b_receita_por_categoria")),
        },
    )

    write(
        "seasonality",
        {
            "monthly": records(analysis(engine, "03a_vendas_mensais")),
            "heatmap": records(analysis(engine, "03b_vendas_dia_hora")),
            "peak_days": records(analysis(engine, "03c_dias_de_pico")),
        },
    )

    at_risk = segments.set_index("segment").loc["at_risk_high_value"]
    write(
        "rfm",
        {
            "segments": records(segments),
            "repeat_rate": repeat_rate,
            "scenario": {
                "segment": "at_risk_high_value",
                "reactivation_rate": REACTIVATION_RATE,
                "customers_reactivated": round(at_risk["customers"] * REACTIVATION_RATE),
                "potential_revenue": round(
                    at_risk["customers"] * REACTIVATION_RATE * at_risk["avg_monetary"], 2
                ),
            },
        },
    )

    logistics = analysis(engine, "05_entrega_por_estado")
    write(
        "logistics",
        {
            "states": records(logistics),
            # Entre estados: o que explica melhor a nota, cumprir o prazo ou entregar rápido?
            "correlation": {
                "late_rate_vs_score": round(
                    float(logistics["late_rate"].corr(logistics["avg_score"])), 3
                ),
                "delivery_days_vs_score": round(
                    float(logistics["avg_delivery_days"].corr(logistics["avg_score"])), 3
                ),
            },
        },
    )

    load_report_path = PROCESSED_DIR / "load_report.json"
    write(
        "quality",
        {
            "checks": quality.run_checks(engine),
            "tables": json.loads(load_report_path.read_text()) if load_report_path.exists() else {},
        },
    )

    write(
        "sql",
        {p.stem: p.read_text(encoding="utf-8") for p in sorted(ANALYSIS_DIR.glob("*.sql"))},
    )
    write("meta", {"generated_at": datetime.now(UTC).isoformat(timespec="seconds")})


if __name__ == "__main__":
    from src.config import get_engine

    export(get_engine())
