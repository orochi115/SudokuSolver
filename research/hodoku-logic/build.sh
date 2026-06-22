#!/usr/bin/env bash
# Compile the whole (copied) HoDoKu tree + the LogicalBatchSolver driver.
# GUI/Swing classes compile fine on JDK 21 but are never loaded at runtime.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf out
mkdir -p out

echo "Compiling $(find src -name '*.java' | wc -l | tr -d ' ') java files ..."
find src -name '*.java' > out/sources.txt
javac -encoding UTF-8 -nowarn -d out @out/sources.txt 2> out/javac.log || {
    echo "javac FAILED — see out/javac.log (tail below):"
    tail -30 out/javac.log
    exit 1
}
echo "OK -> out/  ($(find out -name '*.class' | wc -l | tr -d ' ') classes)"
