"""Baixa o dataset Olist do Kaggle e extrai os CSVs em data/raw/."""

import sys

from src.config import RAW_DIR

DATASET = "olistbr/brazilian-ecommerce"

EXPECTED_FILES = [
    "olist_customers_dataset.csv",
    "olist_geolocation_dataset.csv",
    "olist_order_items_dataset.csv",
    "olist_order_payments_dataset.csv",
    "olist_order_reviews_dataset.csv",
    "olist_orders_dataset.csv",
    "olist_products_dataset.csv",
    "olist_sellers_dataset.csv",
    "product_category_name_translation.csv",
]


def missing_files() -> list[str]:
    return [f for f in EXPECTED_FILES if not (RAW_DIR / f).exists()]


def download(force: bool = False) -> None:
    if not force and not missing_files():
        print("CSVs já presentes em data/raw/, download ignorado.")
        return

    try:
        # Import tardio: o pacote kaggle tenta autenticar já no import.
        from kaggle.api.kaggle_api_extended import KaggleApi

        api = KaggleApi()
        api.authenticate()
    except Exception as exc:  # noqa: BLE001 - mensagem amigável para qualquer falha de credencial
        sys.exit(
            "Não foi possível autenticar na Kaggle API.\n"
            "Gere um token em https://www.kaggle.com/settings e salve o kaggle.json em\n"
            "%USERPROFILE%\\.kaggle\\ (Windows) ou ~/.kaggle/ (Linux/macOS).\n"
            f"Detalhe: {exc}"
        )

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Baixando {DATASET} para {RAW_DIR} ...")
    api.dataset_download_files(DATASET, path=str(RAW_DIR), unzip=True, quiet=False)

    if missing := missing_files():
        sys.exit(f"Download concluído, mas faltam arquivos: {missing}")
    print("Download concluído.")


if __name__ == "__main__":
    download(force="--force" in sys.argv)
