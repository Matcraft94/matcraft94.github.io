---
title: "ML-Assisted Graph Partitioning"
subtitle: "Learning which columns to keep while an exact solver protects solution validity"
description: "Research on learned column ranking and dual stabilization for connected graph partitioning. The work combines combinatorial optimization, supervised learning, exact pricing oracles, and preregistered experiments. Its governing rule is simple: ML can guide the search, but the solver still verifies every partition."
category: "optimization-research"
tags: ["combinatorial-optimization", "column-generation", "lightgbm", "dual-stabilization", "experimental-design"]
pubDate: 2026-10-25
featured: true
featuredOrder: 2
status: "published"
projectStatus: "research-in-progress"
codeAvailability: "partial"
metrics:
  - label: "LP trajectory improvement"
    value: "−0.267"
    note: "F5 median; 23 reserved dense instances, fixed-budget regime"
  - label: "Integer improvement from ML"
    value: "Not shown"
    note: "F5 median −3, p = 0.709; F6 re-tests the question"
  - label: "Confirmatory instances"
    value: "22"
    note: "F6 battery in progress, three solver seeds"
stack: ["Python", "Gurobi", "LightGBM", "NetworkX", "igraph", "column generation", "Wilcoxon tests"]
---

## Overview

This research studies whether machine learning can help a column-generation
solver make better decisions during graph partitioning without weakening the
solver's correctness guarantees.

The broader problem asks for exactly *k* connected graph components with a
minimum size constraint. It is NP-hard, and the pricing problem used to generate
new columns is also difficult.

## Problem

A common column-generation rule retains the columns with the best immediate
reduced costs. That choice is reasonable, but a column that looks best now may
not lead to the best master problem or integer solution later.

The research asks three connected questions:

- Can a learned ranker select a more useful set of columns than the standard
  reduced-cost rule?
- Does dual stabilization explain or change that benefit?
- How good is the heuristic pricing rule when compared with an exact oracle?

The working principle is **ML proposes; the solver decides**. Learned components
can affect search time and solution quality, but never partition feasibility or
connectivity.

## What I built

**A faithful, instrumented solver replica.** The experimental code reproduces
the published spectral column-generation approach while recording trajectories,
master problems, bounds, incumbents, and solver configuration.

**A learned retention rule.** A LambdaMART ranker scores candidate columns using
structural and trajectory features. Its output changes which columns are
retained; it does not replace the optimization model.

**A dual-stabilization baseline.** Recursive dual smoothing provides a classical
comparison, allowing the experiment to separate the effect of ML from the effect
of stabilization.

**An exact pricing oracle.** Small and medium instances can be checked against
exact pricing to identify when the heuristic misses improving columns. This also
exposed a formulation defect and a stopping rule whose behavior depends on the
dual state.

**A preregistered evaluation protocol.** Experiments distinguish LP trajectory,
final integer incumbent, bound, gap, closure rate, and runtime. Every candidate
partition is checked for exact vertex coverage, component count, and induced
connectivity.

<figure class="flow-diagram" aria-labelledby="solver-flow-caption">
  <ol class="flow-steps" role="list">
    <li>
      <span class="flow-step-number">01</span>
      <strong>Candidate columns</strong>
      <p>Pricing generates possible additions to the master problem.</p>
    </li>
    <li>
      <span class="flow-step-number">02</span>
      <strong>Retention strategies</strong>
      <p>Compare reduced-cost rules, learned ranking, and dual smoothing.</p>
    </li>
    <li>
      <span class="flow-step-number">03</span>
      <strong>Master solver</strong>
      <p>Optimize over the retained columns and record the trajectory.</p>
    </li>
    <li>
      <span class="flow-step-number">04</span>
      <strong>Validity checks</strong>
      <p>Verify exact coverage, component count, and connectivity.</p>
    </li>
    <li>
      <span class="flow-step-number">05</span>
      <strong>Separate evaluation</strong>
      <p>Measure LP progress, integer quality, bounds, and runtime.</p>
    </li>
  </ol>
  <figcaption id="solver-flow-caption">Learned ranking and dual smoothing can guide retention. They never replace the solver's feasibility and connectivity checks.</figcaption>
</figure>

## Evidence so far

In the F5 fixed-budget regime, the learned retention rule improved the LP
trajectory on 23 reserved dense instances: median normalized difference
**−0.267**, with **p = 0.00098**. A common-horizon sensitivity analysis was also
favorable.

That result does **not** establish an integer improvement. The corresponding F5
integer comparison had median difference **−3** and **p = 0.709**. In contrast,
dual stabilization without ML showed a promising incumbent improvement in that
regime, with median difference **−31** and **p = 0.009** after the reported
multiple-comparison control.

The exact-oracle work provides a different kind of evidence: reproducible
counterexamples and solver certificates. Among other findings, it shows why a
filter can leave an empty heuristic pool even when an improving column exists.
These are bounded observations about the analyzed formulation and trajectories,
not universal claims about spectral pricing.

## Current experiment

F6 evaluates the frozen factorial design: standard retention, learned retention,
stabilization alone, and their combination. The confirmatory battery contains 22
reserved instances and three solver seeds under the published time and column
settings.

The experiment is still in progress. This page therefore reports the earlier F5
results with their scope and does not claim a confirmatory F6 conclusion.

## Limitations and availability

The current evidence is limited to the documented graph family, size range,
minimum-size setting, off-policy training procedure, and hardware. Better LP
trajectories do not imply better integer solutions or faster end-to-end runs.
Open gaps and unequal closure rates must remain visible when comparing methods.

The original authors' baseline is public; my research modules, generated masters,
and experimental artifacts currently live in a local research repository. This
case is a research summary, not a claim of a public software release.
