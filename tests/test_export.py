import json
from decimal import Decimal

import numpy as np
import pandas as pd
import pytest

from src import export
from src.config import WEB_DATA_DIR


def test_records_replaces_nan_with_none():
    df = pd.DataFrame({"month": ["2017-01", "2017-02"], "revenue_mom": [np.nan, 0.25]})
    assert export.records(df) == [
        {"month": "2017-01", "revenue_mom": None},
        {"month": "2017-02", "revenue_mom": 0.25},
    ]


def test_json_default_handles_decimal_and_numpy():
    payload = {"a": Decimal("1.50"), "b": np.int64(3), "c": np.float64(0.5)}
    assert json.loads(json.dumps(payload, default=export._json_default)) == {
        "a": 1.5,
        "b": 3,
        "c": 0.5,
    }


EXPECTED_KEYS = {
    "kpis": {"orders", "revenue", "avg_ticket", "customers", "avg_score", "late_rate"},
    "delivery_review": {"buckets", "stats"},
    "revenue": {"states", "categories"},
    "seasonality": {"monthly", "heatmap", "peak_days"},
    "rfm": {"segments", "repeat_rate", "scenario"},
    "logistics": {"states", "correlation"},
    "quality": {"checks", "tables"},
}


@pytest.mark.parametrize("name,keys", EXPECTED_KEYS.items())
def test_exported_files_match_site_contract(name, keys):
    path = WEB_DATA_DIR / f"{name}.json"
    if not path.exists():
        pytest.skip("rode o pipeline para gerar os dados")
    data = json.loads(path.read_text(encoding="utf-8"))
    assert keys <= data.keys()
