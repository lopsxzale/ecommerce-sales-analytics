import numpy as np
import pandas as pd
import pytest

from src import stats


def make_scores(late_mean_shift: float, n: int = 4_000) -> pd.DataFrame:
    rng = np.random.default_rng(7)
    delay = rng.integers(-20, 15, n)
    base = rng.choice([1, 2, 3, 4, 5], n, p=[0.08, 0.04, 0.08, 0.2, 0.6])
    score = np.where(delay > 0, np.clip(np.round(base - late_mean_shift), 1, 5), base)
    return pd.DataFrame({"review_score": score.astype(int), "delay_days": delay})


def test_detects_lower_scores_for_late_orders():
    result = stats.late_vs_on_time(make_scores(late_mean_shift=1.5))
    assert result["mean_late"] < result["mean_on_time"]
    assert result["p_value"] < 0.001
    low, high = result["mean_diff_ci95"]
    assert low < result["mean_diff"] < high
    assert low > 0
    assert result["negative_rate_late"] > result["negative_rate_on_time"]


def test_no_effect_when_scores_do_not_depend_on_delay():
    result = stats.late_vs_on_time(make_scores(late_mean_shift=0))
    assert result["p_value"] > 0.01
    low, high = result["mean_diff_ci95"]
    assert low < 0 < high


def test_counterfactual_score_and_counts():
    df = make_scores(late_mean_shift=1.0)
    result = stats.late_vs_on_time(df)
    assert result["n_late"] + result["n_on_time"] == len(df)
    assert result["avg_score_if_no_delays"] > result["avg_score_now"]
    assert result["late_share"] == pytest.approx((df["delay_days"] > 0).mean(), abs=1e-4)
