/*
 * LogicalBatchSolver — standalone, headless, brute-force-free batch runner for HoDoKu.
 *
 * This file is NOT part of upstream HoDoKu. It is a thin driver written for the
 * SudokuSolver "diabolical-727" experiment. It reuses HoDoKu's logical solver
 * (SudokuSolver / SudokuStepFinder and the human-technique solvers) with the
 * brute-force, template and give-up steps DISABLED, so a puzzle is only ever
 * solved by human-style logical deductions. No backtracking / DLX is touched.
 *
 * Because it links HoDoKu (GPLv3) at compile time, this driver is likewise
 * distributed under the GNU General Public License v3 (see ../../COPYING).
 */
package sudoku;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import solver.SudokuSolver;
import solver.SudokuSolverFactory;

/**
 * Usage:
 *   java -Djava.awt.headless=true -cp out:src sudoku.LogicalBatchSolver \
 *        &lt;puzzles.txt&gt; &lt;out-dir&gt; [--verbose]
 *
 * Input: one 81-char puzzle per line ('0' or '.' = empty); blank lines and
 *        lines whose first non-space char is '#' are ignored.
 * Output (in out-dir):
 *   hodoku-727.tsv        idx  status  level  score  techniques(name*count,...)
 *   hodoku-727-summary.md census + technique histogram + first-missing-family buckets
 *   stuck-finals.txt      81-char partial board for every puzzle HoDoKu could not solve
 */
public class LogicalBatchSolver {

    /**
     * Base set of step types that are never "human logic": guessing, template
     * enumeration, surrender. Always disabled.
     */
    private static final SolutionType[] BASE_DISABLED = {
            SolutionType.BRUTE_FORCE,
            SolutionType.TEMPLATE_SET,
            SolutionType.TEMPLATE_DEL,
            SolutionType.GIVE_UP,
            SolutionType.INCOMPLETE };

    /**
     * Additionally disabled under --strict: forcing NETS (not forcing chains).
     * The SudokuSolver project red line forbids "无约束 forcing nets" as
     * non-human, while it does implement plain forcing chains. --strict answers
     * "how many survive on the technique set Roadmap ② actually allows".
     */
    private static final SolutionType[] STRICT_DISABLED = {
            SolutionType.FORCING_NET,
            SolutionType.FORCING_NET_CONTRADICTION,
            SolutionType.FORCING_NET_VERITY };

    /** Populated in main() from BASE_DISABLED (+ STRICT_DISABLED when --strict). */
    private static java.util.Set<SolutionType> DISABLED;

    /** Swallows HoDoKu's internal stdout debug noise during solving. */
    private static final java.io.PrintStream NULL_OUT =
            new java.io.PrintStream(java.io.OutputStream.nullOutputStream());

    /**
     * Technique arg-names already implemented by the SudokuSolver TS engine
     * (packages/engine/src/strategies). Used only to label the "first missing
     * technique family" for each stuck/solved puzzle — i.e. the first step
     * HoDoKu used that the TS engine does not yet have.
     */
    // argNames are HoDoKu's SolutionType codes (see SolutionType.java). Only
    // techniques that map to a real engine strategy are listed. Generalization-
    // ambiguous HoDoKu variants (xy-chain, nice loops, finned/franken/mutant
    // fish, multi-coloring, ALS-XY-chain, etc.) are deliberately LEFT OUT so
    // they show up as "missing families" for human review.
    private static final java.util.Set<String> ENGINE_HAS = new java.util.HashSet<>(java.util.Arrays.asList(
            "fh", "h1", "n1",                               // singles
            "lc", "lc1", "lc2",                             // locked candidates (pointing/claiming)
            "n2", "n3", "n4", "h2", "h3", "h4", "l2", "l3", // subsets (locked pair/triple subsumed)
            "bf2", "bf3", "bf4",                            // basic fish: X-Wing / Swordfish / Jellyfish
            "sk", "2sk", "er",                              // single-digit patterns
            "xy", "xyz", "w",                               // wings
            "sc", "sc1", "sc2",                             // simple coloring (+ trap/wrap)
            "x",                                            // X-Chain
            "aic",                                          // AIC
            "axz", "axy", "db",                             // ALS-XZ (+doubly-linked), ALS-XY-Wing, Death Blossom
            "bug1", "u1", "u2", "u4",                       // BUG+1, Unique Rectangle 1/2/4
            "sdc",                                          // Sue de Coq
            "fc", "fcc", "fcv"));                           // forcing chain

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: LogicalBatchSolver <puzzles.txt> <out-dir> [--verbose] [--strict]");
            System.exit(2);
        }
        String puzzleFile = args[0];
        File outDir = new File(args[1]);
        outDir.mkdirs();
        boolean verbose = false, strict = false;
        for (int i = 2; i < args.length; i++) {
            if (args[i].equals("--verbose")) verbose = true;
            else if (args[i].equals("--strict")) strict = true;
        }

        // Silence HoDoKu's java.util.logging chatter ("信息: ..."); keep warnings.
        java.util.logging.Logger.getLogger("").setLevel(java.util.logging.Level.WARNING);

        DISABLED = java.util.EnumSet.of(BASE_DISABLED[0],
                java.util.Arrays.copyOfRange(BASE_DISABLED, 1, BASE_DISABLED.length));
        if (strict) {
            DISABLED.addAll(java.util.Arrays.asList(STRICT_DISABLED));
        }
        System.out.println("Mode: " + (strict ? "STRICT (no forcing nets)" : "full HoDoKu logic"));

        // --- Configure the solver: keep every human technique, kill the rest. ---
        Options opt = Options.getInstance();
        opt.setCheckTemplates(false); // do not let template logic prune candidates
        int disabledCount = 0;
        for (StepConfig sc : opt.solverSteps) {
            if (DISABLED.contains(sc.getType())) {
                sc.setEnabled(false);
                disabledCount++;
            }
        }
        System.out.println("Disabled " + disabledCount + " non-logical step types: " + DISABLED);

        SudokuSolver solver = SudokuSolverFactory.getDefaultSolverInstance();

        // --- Accumulators ---
        int total = 0, solved = 0, stuck = 0, invalid = 0;
        // global technique histogram (over all solved puzzles)
        Map<String, Integer> techHist = new TreeMap<>();
        // "first technique HoDoKu used that the engine lacks" -> count
        Map<String, Integer> firstMissing = new TreeMap<>();

        PrintWriter tsv = new PrintWriter(new File(outDir, "hodoku-727.tsv"));
        PrintWriter stuckOut = new PrintWriter(new File(outDir, "stuck-finals.txt"));
        tsv.println("idx\tstatus\tlevel\tscore\ttechniques");

        BufferedReader in = new BufferedReader(new FileReader(puzzleFile));
        String line;
        int idx = 0;
        while ((line = in.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty() || line.charAt(0) == '#') {
                continue;
            }
            idx++;
            total++;

            Sudoku2 sudoku = new Sudoku2();
            sudoku.setSudoku(line);
            solver.setSudoku(sudoku);

            // HoDoKu's chaining solvers print debug directly to stdout; mute it
            // around the solve so only our own output reaches the console.
            java.io.PrintStream realOut = System.out;
            System.setOut(NULL_OUT);
            try {
                solver.solve();
            } finally {
                System.setOut(realOut);
            }

            List<SolutionStep> steps = solver.getSteps();

            // Hard guarantee: no disabled (guessing/template/give-up) step was ever used.
            for (SolutionStep st : steps) {
                if (DISABLED.contains(st.getType())) {
                    System.err.println("FATAL: non-logical step used on puzzle #" + idx
                            + ": " + st.getType() + " — brute force/template leaked in!");
                    tsv.flush();
                    stuckOut.flush();
                    System.exit(3);
                }
            }

            boolean isSolved = sudoku.isSolved();
            String status;
            if (isSolved) {
                if (validBoard(sudoku)) {
                    status = "solved";
                    solved++;
                } else {
                    status = "INVALID";
                    invalid++;
                    System.err.println("INVALID solution on puzzle #" + idx + ": " + line);
                }
            } else {
                status = "stuck";
                stuck++;
                stuckOut.println(sudoku.getSudoku(ClipboardMode.VALUES_ONLY));
            }

            // Per-puzzle technique counts (in application order) + global histogram.
            Map<String, Integer> perPuzzle = new LinkedHashMap<>();
            String firstMissingFamily = null;
            for (SolutionStep st : steps) {
                String name = st.getType().getStepName();
                perPuzzle.merge(name, 1, Integer::sum);
                if (status.equals("solved")) {
                    techHist.merge(name, 1, Integer::sum);
                }
                if (firstMissingFamily == null && !engineHas(st.getType())) {
                    firstMissingFamily = name;
                }
            }
            if (firstMissingFamily != null) {
                firstMissing.merge(firstMissingFamily, 1, Integer::sum);
            } else if (!isSolved) {
                // stuck but every step was a technique the engine already has:
                // means the engine should have gotten further — flag separately.
                firstMissing.merge("(stuck, no new family)", 1, Integer::sum);
            }

            tsv.println(idx + "\t" + status + "\t"
                    + (isSolved ? solver.getLevel().getName() : "-") + "\t"
                    + solver.getScore() + "\t" + fmtCounts(perPuzzle));

            if (verbose) {
                System.out.println("#" + idx + " [" + status + "] "
                        + (isSolved ? solver.getLevel().getName() : "-")
                        + " score=" + solver.getScore());
                for (SolutionStep st : steps) {
                    System.out.println("    " + st.toString(2));
                }
            } else if (idx % 25 == 0) {
                System.out.println("  ... " + idx + " puzzles (" + solved + " solved, "
                        + stuck + " stuck)");
            }
            // Flush each puzzle so partial results survive and progress is observable
            // (PrintWriter otherwise buffers until close).
            tsv.flush();
            stuckOut.flush();
        }
        in.close();
        tsv.close();
        stuckOut.close();

        // --- Summary ---
        StringBuilder sb = new StringBuilder();
        sb.append("# HoDoKu pure-logic census of the 727 diabolical puzzles\n\n");
        sb.append("Source puzzles: `").append(puzzleFile).append("`\n\n");
        sb.append("Mode: **").append(strict ? "STRICT (no forcing nets)" : "full HoDoKu logic").append("**\n\n");
        sb.append("Disabled (never \"human logic\"): ").append(DISABLED).append("\n\n");
        sb.append("Brute force / templates / give-up: **disabled** (zero backtracking).\n\n");
        sb.append("| metric | count |\n|---|---|\n");
        sb.append("| total | ").append(total).append(" |\n");
        sb.append("| solved (pure logic) | ").append(solved).append(" |\n");
        sb.append("| stuck | ").append(stuck).append(" |\n");
        sb.append("| invalid | ").append(invalid).append(" |\n\n");

        sb.append("## Technique histogram (over solved puzzles)\n\n");
        sb.append("| technique | total uses |\n|---|---|\n");
        sortedByValueDesc(techHist).forEach(e ->
                sb.append("| ").append(e.getKey()).append(" | ").append(e.getValue()).append(" |\n"));

        sb.append("\n## First technique HoDoKu used that the TS engine lacks\n\n");
        sb.append("(per-puzzle: the earliest step whose technique is not yet in the engine — the clustering signal for Roadmap ②)\n\n");
        sb.append("| first-missing family | puzzles |\n|---|---|\n");
        sortedByValueDesc(firstMissing).forEach(e ->
                sb.append("| ").append(e.getKey()).append(" | ").append(e.getValue()).append(" |\n"));

        PrintWriter md = new PrintWriter(new File(outDir, "hodoku-727-summary.md"));
        md.print(sb);
        md.close();

        System.out.println();
        System.out.println("=== DONE ===");
        System.out.println("total=" + total + " solved=" + solved + " stuck=" + stuck + " invalid=" + invalid);
        System.out.println("wrote: " + new File(outDir, "hodoku-727.tsv"));
        System.out.println("wrote: " + new File(outDir, "hodoku-727-summary.md"));
        System.out.println("wrote: " + new File(outDir, "stuck-finals.txt"));

        // HoDoKu's SudokuSolverFactory starts a non-daemon while(true) cleanup
        // thread, so the JVM never exits on its own — force it.
        System.out.flush();
        System.exit(invalid > 0 ? 1 : 0);
    }

    /** True if the technique is one the TS engine already implements. */
    private static boolean engineHas(SolutionType t) {
        // Brute force / template / give-up are disabled and never appear; treat
        // them as "not a real technique" rather than matching the 'bf' argName.
        if (DISABLED.contains(t)) {
            return true; // they should never appear anyway
        }
        return ENGINE_HAS.contains(t.getArgName());
    }

    /** Validate a completed board: every row/col/box holds 1..9 exactly once. */
    private static boolean validBoard(Sudoku2 s) {
        for (int i = 0; i < 81; i++) {
            if (s.getValue(i) < 1 || s.getValue(i) > 9) {
                return false;
            }
        }
        // rows, cols, boxes
        for (int u = 0; u < 9; u++) {
            boolean[] r = new boolean[10], c = new boolean[10], b = new boolean[10];
            for (int k = 0; k < 9; k++) {
                int rv = s.getValue(u * 9 + k);
                int cv = s.getValue(k * 9 + u);
                int br = (u / 3) * 3 + k / 3;
                int bc = (u % 3) * 3 + k % 3;
                int bv = s.getValue(br * 9 + bc);
                if (r[rv] || c[cv] || b[bv]) {
                    return false;
                }
                r[rv] = c[cv] = b[bv] = true;
            }
        }
        return true;
    }

    private static String fmtCounts(Map<String, Integer> m) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Integer> e : m.entrySet()) {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(e.getKey()).append("*").append(e.getValue());
        }
        return sb.toString();
    }

    private static List<Map.Entry<String, Integer>> sortedByValueDesc(Map<String, Integer> m) {
        List<Map.Entry<String, Integer>> list = new ArrayList<>(m.entrySet());
        list.sort((a, b) -> b.getValue() - a.getValue());
        return list;
    }
}
