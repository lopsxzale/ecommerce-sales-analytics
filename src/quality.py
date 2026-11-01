"""Checagens de qualidade de dados, rodadas no banco depois da carga.

Cada checagem diz o que foi encontrado e como foi tratado na análise.
"""

import json

from sqlalchemy import Engine, text

from src.config import PROCESSED_DIR

CHECKS = [
    {
        "id": "excluded_orders",
        "sql": "SELECT COUNT(*) FROM orders WHERE order_status IN ('canceled', 'unavailable')",
        "total_sql": "SELECT COUNT(*) FROM orders",
        "label": {
            "pt": "Pedidos cancelados ou indisponíveis",
            "en": "Canceled or unavailable orders",
        },
        "treatment": {
            "pt": "Excluídos das métricas de receita",
            "en": "Excluded from revenue metrics",
        },
    },
    {
        "id": "orders_without_items",
        "sql": """SELECT COUNT(*) FROM orders o
                  WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.order_id)""",
        "total_sql": "SELECT COUNT(*) FROM orders",
        "label": {"pt": "Pedidos sem itens", "en": "Orders without items"},
        "treatment": {
            "pt": "Ignorados nas análises de receita (INNER JOIN)",
            "en": "Ignored in revenue analyses (INNER JOIN)",
        },
    },
    {
        "id": "delivered_without_date",
        "sql": """SELECT COUNT(*) FROM orders
                  WHERE order_status = 'delivered' AND order_delivered_customer_date IS NULL""",
        "total_sql": "SELECT COUNT(*) FROM orders WHERE order_status = 'delivered'",
        "label": {
            "pt": "Entregues sem data de entrega",
            "en": "Delivered orders missing delivery date",
        },
        "treatment": {
            "pt": "Excluídos das análises de prazo",
            "en": "Excluded from delivery-time analyses",
        },
    },
    {
        "id": "orders_multiple_reviews",
        "sql": """SELECT COUNT(*) FROM (
                      SELECT order_id FROM order_reviews GROUP BY order_id HAVING COUNT(*) > 1
                  ) t""",
        "total_sql": "SELECT COUNT(DISTINCT order_id) FROM order_reviews",
        "label": {
            "pt": "Pedidos com mais de um review",
            "en": "Orders with more than one review",
        },
        "treatment": {
            "pt": "Mantido o review mais recente (ROW_NUMBER)",
            "en": "Kept the most recent review (ROW_NUMBER)",
        },
    },
    {
        "id": "products_without_category",
        "sql": "SELECT COUNT(*) FROM products WHERE product_category_name IS NULL",
        "total_sql": "SELECT COUNT(*) FROM products",
        "label": {"pt": "Produtos sem categoria", "en": "Products without category"},
        "treatment": {
            "pt": 'Agrupados como "sem categoria"',
            "en": 'Grouped as "uncategorized"',
        },
    },
    {
        "id": "categories_without_translation",
        "sql": """SELECT COUNT(DISTINCT p.product_category_name) FROM products p
                  LEFT JOIN category_translation t USING (product_category_name)
                  WHERE p.product_category_name IS NOT NULL
                    AND t.product_category_name IS NULL""",
        "total_sql": "SELECT COUNT(DISTINCT product_category_name) FROM products",
        "label": {
            "pt": "Categorias sem tradução para inglês",
            "en": "Categories without English translation",
        },
        "treatment": {
            "pt": "Usado o nome original em português",
            "en": "Original Portuguese name used",
        },
    },
]


def run_checks(engine: Engine) -> list[dict]:
    results = []
    with engine.connect() as conn:
        for check in CHECKS:
            value = conn.execute(text(check["sql"])).scalar_one()
            total = conn.execute(text(check["total_sql"])).scalar_one()
            results.append(
                {
                    "id": check["id"],
                    "value": int(value),
                    "total": int(total),
                    "rate": round(value / total, 4) if total else 0.0,
                    "label": check["label"],
                    "treatment": check["treatment"],
                }
            )

    report_path = PROCESSED_DIR / "load_report.json"
    if report_path.exists():
        reviews = json.loads(report_path.read_text())["order_reviews"]
        removed = reviews["raw_rows"] - reviews["loaded_rows"]
        results.append(
            {
                "id": "duplicate_reviews_removed",
                "value": removed,
                "total": reviews["raw_rows"],
                "rate": round(removed / reviews["raw_rows"], 4),
                "label": {
                    "pt": "Reviews duplicados no CSV bruto",
                    "en": "Duplicate reviews in raw CSV",
                },
                "treatment": {
                    "pt": "Removidos na carga (chave review_id + order_id)",
                    "en": "Removed at load (review_id + order_id key)",
                },
            }
        )

    for r in results:
        print(f"  {r['id']:<32} {r['value']:>7,} / {r['total']:,}")
    return results
