"""Teste estatístico: pedidos atrasados recebem notas menores?

Notas de review são ordinais (1 a 5), então o teste principal é o Mann-Whitney U,
não paramétrico. A diferença de médias com IC de 95% (Welch) entra por ser a medida
mais fácil de comunicar para o negócio.
"""

import numpy as np
import pandas as pd
from scipy import stats


def late_vs_on_time(scores: pd.DataFrame) -> dict:
    """Recebe review_score e delay_days por pedido."""
    late_mask = scores["delay_days"] > 0
    late = scores.loc[late_mask, "review_score"].to_numpy(dtype=float)
    on_time = scores.loc[~late_mask, "review_score"].to_numpy(dtype=float)

    u_stat, p_value = stats.mannwhitneyu(on_time, late, alternative="two-sided")
    # Correlação rank-bisserial: tamanho de efeito do Mann-Whitney, entre -1 e 1.
    # Positiva quando pedidos no prazo tendem a ter notas maiores.
    rank_biserial = 2 * u_stat / (len(on_time) * len(late)) - 1

    diff = on_time.mean() - late.mean()
    se = np.sqrt(on_time.var(ddof=1) / len(on_time) + late.var(ddof=1) / len(late))
    z = stats.norm.ppf(0.975)

    spearman = stats.spearmanr(scores["delay_days"], scores["review_score"])

    late_share = len(late) / len(scores)
    current_mean = scores["review_score"].mean()

    return {
        "n_on_time": int(len(on_time)),
        "n_late": int(len(late)),
        "late_share": round(late_share, 4),
        "mean_on_time": round(float(on_time.mean()), 3),
        "mean_late": round(float(late.mean()), 3),
        "mean_diff": round(float(diff), 3),
        "mean_diff_ci95": [round(float(diff - z * se), 3), round(float(diff + z * se), 3)],
        "negative_rate_on_time": round(float((on_time <= 2).mean()), 4),
        "negative_rate_late": round(float((late <= 2).mean()), 4),
        "mann_whitney_u": float(u_stat),
        "p_value": float(p_value),
        "rank_biserial": round(float(rank_biserial), 3),
        "spearman_rho": round(float(spearman.statistic), 3),
        # Cenário: se os atrasados tivessem a média dos pedidos no prazo.
        "avg_score_now": round(float(current_mean), 3),
        "avg_score_if_no_delays": round(float(current_mean + late_share * diff), 3),
    }
