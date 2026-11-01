"""Segmentação RFM (Recência, Frequência, Valor monetário).

R e M são pontuados por quintis (5 = melhor). A frequência não serve para quintis no
Olist: a grande maioria dos clientes compra uma única vez. Por isso ela entra nos
segmentos como regra explícita (comprou mais de uma vez ou não), o que também
evidencia o problema de retenção.
"""

import numpy as np
import pandas as pd

# Ordem de exibição, do mais valioso ao menos engajado.
SEGMENTS = [
    "champions",
    "loyal",
    "new_high_value",
    "new",
    "at_risk_high_value",
    "need_attention",
    "hibernating",
]


def quintile_score(values: pd.Series, higher_is_better: bool = True) -> pd.Series:
    """Pontua de 1 a 5 por quintis. O rank desempata valores repetidos."""
    labels = [1, 2, 3, 4, 5] if higher_is_better else [5, 4, 3, 2, 1]
    ranks = values.rank(method="first")
    return pd.qcut(ranks, 5, labels=labels).astype(int)


def frequency_score(frequency: pd.Series) -> pd.Series:
    return pd.Series(
        np.select([frequency >= 4, frequency == 3, frequency == 2], [5, 4, 3], default=1),
        index=frequency.index,
    )


def score(customers: pd.DataFrame) -> pd.DataFrame:
    """Recebe recency_days, frequency e monetary por cliente; devolve scores e segmento."""
    df = customers.copy()
    df["r_score"] = quintile_score(df["recency_days"], higher_is_better=False)
    df["f_score"] = frequency_score(df["frequency"])
    df["m_score"] = quintile_score(df["monetary"])

    repeat = df["frequency"] >= 2
    recent = df["r_score"] >= 4
    mid = df["r_score"].between(2, 3)
    high_value = df["m_score"] >= 4

    df["segment"] = np.select(
        [
            repeat & recent,
            repeat,
            recent & high_value,
            recent,
            mid & high_value,
            mid,
        ],
        SEGMENTS[:-1],
        default="hibernating",
    )
    return df


def summarize(scored: pd.DataFrame) -> pd.DataFrame:
    total_customers = len(scored)
    total_revenue = scored["monetary"].sum()
    summary = (
        scored.groupby("segment")
        .agg(
            customers=("customer_unique_id", "count"),
            avg_recency_days=("recency_days", "mean"),
            avg_frequency=("frequency", "mean"),
            avg_monetary=("monetary", "mean"),
            revenue=("monetary", "sum"),
        )
        .reindex(SEGMENTS)
        .dropna(subset=["customers"])
        .reset_index()
    )
    summary["customers"] = summary["customers"].astype(int)
    summary["customer_share"] = summary["customers"] / total_customers
    summary["revenue_share"] = summary["revenue"] / total_revenue
    return summary.round(
        {
            "avg_recency_days": 1,
            "avg_frequency": 3,
            "avg_monetary": 2,
            "revenue": 2,
            "customer_share": 4,
            "revenue_share": 4,
        }
    )


def repeat_rate(customers: pd.DataFrame) -> float:
    return round(float((customers["frequency"] >= 2).mean()), 4)
