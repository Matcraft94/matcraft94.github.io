---
title: "tda-psych"
subtitle: "Topological Data Analysis for Psychometrics — persistent homology on item-response data, validated against known topology"
description: "A Python library applying persistent homology, mapper graphs and network analysis to psychometric data, with a mathematical test suite that checks persistence computations against manifolds of known Betti numbers, and three reproducible case studies on simulated instruments with ground truth."
category: "psychometrics"
tags: ["tda", "persistent-homology", "mapper", "psychometrics", "irt", "topological-data-analysis", "pytest"]
pubDate: 2026-03-07
featured: false
status: "published"
metrics:
  - label: "Test functions"
    value: "846"
    note: "across 53 test files, unit → e2e"
  - label: "Ground-truth manifolds"
    value: "S¹, S², T²"
    note: "persistence checked vs known Betti numbers"
  - label: "Library modules"
    value: "15"
  - label: "Case 2 stability"
    value: "200/200"
    note: "bootstrap replicates with identical β₀"
stack: ["Python 3.10+", "NumPy", "SciPy", "pandas", "scikit-learn", "GUDHI", "Ripser", "pytest", "Docker"]
---

## Problem

Psychometrics reasons about latent structure — dimensions, clusters, learning
trajectories — but its standard tools (factor analysis, IRT, EGA) each see a
narrow slice of that structure. Topological Data Analysis offers complements:
persistent homology tracks how connected components, cycles and voids appear
and disappear as a scale parameter grows, without committing to a parametric
latent model up front. The practical problem is that TDA machinery (Vietoris–Rips
complexes, persistence diagrams, mapper graphs) is general-purpose, and nothing
existed that wrapped it for assessment data with the validation discipline
psychometric claims require. This library is my attempt to build that: a
pip-installable package where every topological computation is tested against
objects whose topology is known exactly, before it is ever pointed at a
response matrix.

## Method

`tda-psych` (v1.0.0, MIT, Python 3.10+) is organized as 15 modules
(~28.6k LOC) around a single pipeline: item or person-level response data →
distance matrices (correlation, cosine, Euclidean, Canberra, Bray–Curtis) →
Vietoris–Rips complexes via GUDHI/Ripser → persistence diagrams, Betti curves,
persistence landscapes and images → statistics (bootstrap confidence intervals,
sensitivity analysis, effect sizes, power analysis) → mapper graphs with
community detection for person-centered profiling.

Three design decisions define the project:

- **Validation against ground truth is a first-class test layer, not an
  afterthought.** `tests/validation/` reconstructs manifolds with known Betti
  numbers — circle S¹ (β₀=1, β₁=1), sphere S² (1, 0, 1), torus T² (1, 2, 1) —
  and asserts the computed persistence recovers them, including noisy
  variants.
- **Psychometric methods are checked where they make checkable claims.** EGA
  dimension recovery is tested on simulated 2-factor and 3-factor IRT data
  (500 persons each); the test passes if the recovered dimensionality is
  within ±1 of the generative truth.
- **Every published case study is a reproducible script** (`scripts/chapter4/`,
  runnable directly: `python scripts/chapter4/case{1,2,3}_*.py`, plus
  `make validate-seeds` for the seed replications) over synthetic data with
  known generative structure, with results, figures and seed metadata
  committed to `results/`.

## Evidence

The test suite contains 846 test functions across 53 files, layered unit →
integration → mathematical property tests → validation → end-to-end. The
claims I can verify from committed artifacts:

- **Ground-truth topology recovery.** Persistence on sampled S¹, S², T² and
  two-circle configurations matches the theoretical Betti numbers (these
  tests skip cleanly when GUDHI is unavailable rather than passing vacuously).
  The chart below shows the raw signature these tests assert: the persistence
  lifetime of each homology class, with a clear gap exactly after the rank
  predicted by the manifold's Betti number — computed live with the same
  pipeline (Vietoris–Rips via ripser, seed 42, n=300 for S¹/S² and 500 for
  T², Gaussian noise σ=0.05/0.03) on 2026-10-07.

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Persistent homology recovers known Betti numbers — persistence lifetime by class rank (log scale; the gap after rank β_k is the signature)","xLabel":"manifold / homology class by lifetime rank","yLabel":"persistence lifetime death − birth (log)","labels":["S¹ H₁ #1","S¹ H₁ #2","S² H₂ #1","S² H₂ #2","T² H₁ #1","T² H₁ #2","T² H₁ #3","T² H₂ #1","T² H₂ #2"],"datasets":[{"label":"persistence lifetime","data":[1.435,0.037,0.935,0.011,0.415,0.323,0.233,0.187,0.08]}],"yLog":true,"values":true,"source":"Vietoris–Rips persistence via ripser, seed 42, S¹/S² n=300 σ=0.05, T² n=500 σ=0.03 — computed 2026-10-07"}
</script></div>

- **Code availability.** The library lives in a **private repository** while
  the research program is ongoing; it is shared with reviewers and employers
  on request. Every number in this case study is described against committed
  artifacts so it can be checked the moment access is granted.
- **EGA dimension recovery** on simulated 2- and 3-factor data within ±1
  dimension of truth.
- **Case 1 — topological validation of a mathematics instrument** (simulated
  MIRT-2PL, 200 students × 20 items, 3 intended dimensions). At
  ε = 1.05 the complex yields H₀ = 192 vs a target of 197 (within the ±10
  tolerance the validation encodes), H₁ = 3 and H₂ = 0 matching targets
  exactly; the script's quality score is 0.975. Results were replicated
  across seeds 42, 123 and 456, all committed.
- **Case 2 — Capacity for Pedagogical Agency scale** (simulated, 745
  teachers × 32 items). The result I report is the negative one: for
  ε ≥ 0.10 across an ε grid up to 1.00 the item-level complex stays at
  H₀ = 32, H₁ = 0, H₂ = 0 (the committed Betti curve shows an artifact
  H₀ = 0 only at the ε = 0.05 endpoint) — items never merge into the
  globally connected construct the target (H₀ = 1, H₁ = 4, H₂ = 1)
  hypothesizes; the H₂ = 1 cavity is not recovered either. A 200-replicate
  bootstrap at ε = 0.52
  reproduces β₀ = 32 in 200/200 replicates (H₁ = 0 in 196/200). The expected
  topology was not recovered within the explored grid, and the repository
  says so rather than tuning until it disappears.
- **Case 3 — longitudinal knowledge evolution** (simulated, 300 students ×
  15 items × 4 timepoints, growth-with-reorganization model).

## Results

- A working, documented library with Sphinx API reference, Docker builds,
  CI, and seed-controlled, end-to-end reproducible pipelines.
- A compiled literature review (committed to `research/`) that situates
  the software in the methodological landscape and documents where TDA
  adds information beyond standard psychometrics.
- Case 1 demonstrates the intended use case: a student-level complex whose
  3 persistent cycles line up with the three generative dimensions, stable
  across seeds.
- Case 2 is the more scientifically interesting output: an honest
  non-recovery, with bootstrap evidence that the null topology is stable
  rather than an artifact of one ε choice.

## Honest caveats

Credibility matters more than polish here, so the limits are stated plainly:

- **All three case studies run on synthetic data with known ground truth.**
  No real assessment dataset is analyzed in the repository. The studies
  validate that the pipeline recovers structure that was put there — a
  necessary condition for trusting it on field data, not yet evidence of
  value on field data.
- **The quality scores are hand-constructed.** The "A+" grades come from a
  bespoke weighted distance to pre-set Betti targets (e.g., H₀ ≈ 197 "≈ one
  component per student"), not from a calibrated or published statistic.
- **Case 1's preprocessing underperforms its own documentation.** The script
  docstring states PCA-5D captures >95% of variance; the committed results
  show 53.5% cumulative variance across the five retained components. I did
  not edit either side to make them agree — the discrepancy is itself a
  caveat about dimension-reduction choices before TDA.
- **Case 3's perfect score is self-referential.** The stored "expected"
  β₀ pattern equals the observed pattern (correlation 1.0, RMSE 0), so the
  reported quality of 1.0 is a consistency check, not independent
  validation; the docstring's stated targets ([81, 94, 93, 92]) do not match
  the stored ones ([91, 82, 90, 92]). Treat Case 3 as a pipeline smoke test.
- **Coverage is not quoted here on purpose.** The root `coverage.xml` shows a
  12% line rate that is clearly a stale partial artifact; I could not verify
  a current figure from the repository alone, so it is omitted rather than
  guessed.
- **GUDHI-dependent correctness tests skip** when the C++ backend is missing;
  on a machine without GUDHI the strongest layer of evidence silently does
  not run.

What remains unvalidated, in one line: whether topological summaries of real
response data carry incremental validity over factor analysis and EGA. That
is the question this software infrastructure was built to answer next.
