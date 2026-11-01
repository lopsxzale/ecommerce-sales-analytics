import numpy as np
import pandas as pd
import pytest

from src import rfm


@pytest.fixture
def customers() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    n = 1_000
    return pd.DataFrame(
        {
            "customer_unique_id": [f"c{i}" for i in range(n)],
            "recency_days": rng.integers(1, 700, n),
            "frequency": rng.choice([1, 1, 1, 1, 1, 1, 1, 1, 2, 3], n),
            "monetary": rng.gamma(2.0, 80.0, n).round(2),
        }
    )


def test_quintile_scores_are_balanced(customers):
    scores = rfm.quintile_score(customers["monetary"])
    assert set(scores) == {1, 2, 3, 4, 5}
    assert scores.value_counts().eq(200).all()


def test_recency_score_rewards_recent_customers(customers):
    scored = rfm.score(customers)
    most_recent = scored.loc[scored["recency_days"].idxmin()]
    least_recent = scored.loc[scored["recency_days"].idxmax()]
    assert most_recent["r_score"] == 5
    assert least_recent["r_score"] == 1


def test_frequency_score():
    freq = pd.Series([1, 2, 3, 4, 10])
    assert rfm.frequency_score(freq).tolist() == [1, 3, 4, 5, 5]


def test_every_customer_gets_a_known_segment(customers):
    scored = rfm.score(customers)
    assert scored["segment"].isin(rfm.SEGMENTS).all()


def test_segment_rules(customers):
    scored = rfm.score(customers)
    repeat = scored[scored["frequency"] >= 2]
    assert repeat["segment"].isin(["champions", "loyal"]).all()
    assert (scored.loc[scored["segment"] == "hibernating", "r_score"] == 1).all()
    high_value_new = scored[scored["segment"] == "new_high_value"]
    assert (high_value_new["m_score"] >= 4).all()


def test_summary_shares_add_up(customers):
    summary = rfm.summarize(rfm.score(customers))
    assert summary["customers"].sum() == len(customers)
    assert summary["customer_share"].sum() == pytest.approx(1, abs=1e-3)
    assert summary["revenue_share"].sum() == pytest.approx(1, abs=1e-3)
    # Segue a ordem de exibição definida em SEGMENTS.
    order = [rfm.SEGMENTS.index(s) for s in summary["segment"]]
    assert order == sorted(order)


def test_repeat_rate(customers):
    expected = (customers["frequency"] >= 2).mean()
    assert rfm.repeat_rate(customers) == pytest.approx(expected, abs=1e-4)
