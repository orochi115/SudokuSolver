#!/usr/bin/env bash
# Run the brute-force-free HoDoKu logical batch solver.
#   ./run.sh [puzzles.txt] [out-dir] [--verbose]
# Defaults: puzzles = repo's data/failing-diabolical/puzzles.txt, out-dir = ./results
set -euo pipefail
cd "$(dirname "$0")"

PUZZLES="${1:-../../data/failing-diabolical/puzzles.txt}"
OUTDIR="${2:-results}"
shift $(( $# < 2 ? $# : 2 )) || true   # remaining args are flags (--verbose / --strict)

if [ ! -d out ]; then
    echo "out/ not found — run ./build.sh first." >&2
    exit 1
fi

# -cp includes src so intl/*.properties and other resources load via ResourceBundle.
exec java -Djava.awt.headless=true -Xss64m -cp out:src \
    sudoku.LogicalBatchSolver "$PUZZLES" "$OUTDIR" "$@"
