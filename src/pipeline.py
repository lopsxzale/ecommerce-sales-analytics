"""Executa o pipeline completo: download -> carga -> análises -> export para o site.

Uso:
    python -m src.pipeline                 # tudo
    python -m src.pipeline --skip-load     # só reexporta (banco já carregado)
"""

import argparse
import time

from src import download, export, load
from src.config import get_engine


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--skip-load", action="store_true")
    args = parser.parse_args()

    start = time.perf_counter()

    if not args.skip_download and not args.skip_load:
        print("[1/3] Download")
        download.download()

    if not args.skip_load:
        print("[2/3] Carga no PostgreSQL")
        load.load()

    print("[3/3] Análises, qualidade e export")
    export.export(get_engine())

    print(f"Pipeline concluído em {time.perf_counter() - start:.1f}s")


if __name__ == "__main__":
    main()
