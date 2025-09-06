#!/usr/bin/env python3
"""
Create a DuckDB database at demo/public/cities.duckdb and load CSVs from demo/public.

Tables created:
- capitals      <- us-state-capitals.csv
- cities        <- us-cities-top-1k-multi-year.csv
- demographics  <- us-cities-demographics.csv

Usage:
  python demo/bin/create_duckdb.py

Requires:
  pip install duckdb
"""
from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    try:
        import duckdb  # type: ignore
    except Exception as e:  # pragma: no cover
        print("error: missing dependency 'duckdb' (pip install duckdb)")
        print(f"details: {e}")
        return 2

    # Resolve paths relative to this file
    script_path = Path(__file__).resolve()
    demo_dir = script_path.parents[1]  # react-table-csv/demo
    public_dir = demo_dir / "public"
    db_path = public_dir / "cities.duckdb"

    # Map tables to source CSV filenames
    sources = {
        "capitals": "us-state-capitals.csv",
        "cities": "us-cities-top-1k-multi-year.csv",
        "demographics": "us-cities-demographics.csv",
    }

    # Validate inputs exist
    missing = [name for name in sources.values() if not (public_dir / name).exists()]
    if missing:
        print("error: missing CSV files in demo/public:")
        for m in missing:
            print(f"  - {m}")
        return 1

    public_dir.mkdir(parents=True, exist_ok=True)

    print(f"Creating DuckDB database: {db_path}")
    con = duckdb.connect(str(db_path))
    try:
        # Faster CSV imports
        con.execute("PRAGMA threads=4;")
        con.execute("PRAGMA temp_directory='./tmp';")

        for table, filename in sources.items():
            csv_path = str((public_dir / filename).resolve())
            print(f"- Loading {filename} -> {table}")
            # Drop any existing table then (re)create from CSV with inferred schema
            con.execute(f"DROP TABLE IF EXISTS {duckdb_identifier(table)};")
            con.execute(
                f"CREATE TABLE {duckdb_identifier(table)} AS SELECT * FROM read_csv_auto(?, header=true);",
                [csv_path],
            )
            # Report row count
            cnt = con.execute(f"SELECT COUNT(*) FROM {duckdb_identifier(table)};").fetchone()[0]
            print(f"  inserted {cnt} rows")

        print("Done.")
        return 0
    finally:
        con.close()


def duckdb_identifier(name: str) -> str:
    """Safely quote an identifier for DuckDB (double quotes)."""
    # Escape any embedded quotes by doubling them
    return '"' + name.replace('"', '""') + '"'


if __name__ == "__main__":
    sys.exit(main())

