---
title: "Aurora-GLM"
subtitle: "GLM, GAM and GAMM in Python — R-style formulas, multi-backend, GPU-accelerated"
description: "A published PyPI framework for statistical modeling with automated numerical validation against R and statsmodels in CI, a 3,200+ test suite, and up to 141× GPU acceleration."
category: "ml-engineering"
tags: ["glm", "gam", "statistical-modeling", "pytorch", "jax", "pypi", "open-source"]
repo: "https://github.com/Matcraft94/Aurora-GLM"
pubDate: 2026-09-14
featured: true
status: "published"
metrics:
  - label: "Max deviation vs R"
    value: "1.4e-13"
    note: "20 distribution×replica comparisons"
  - label: "Test suite"
    value: "3,200+"
  - label: "GPU speedup"
    value: "141×"
    note: "PyTorch CUDA vs CPU"
  - label: "Distributions"
    value: "9"
    note: "Gaussian, Poisson, Binomial, Gamma…"
stack: ["Python", "NumPy", "PyTorch", "JAX", "R formulas", "CI numerical validation", "PyPI"]
---

## Problem

Python's statistical-modeling ecosystem is fragmented: `statsmodels` covers
GLMs well but GAMMs force you into a different API entirely, and R's `mgcv`
remains the reference but is not callable from a Python production stack.
There was no Python library combining R-style formula ergonomics, GLM+GAM+GAMM
in one API, and pluggable numerical backends — CPU and GPU.

## Method

Aurora-GLM is my answer, designed and built as an individual research project:

- **One API** for GLM, GAM (penalized splines) and GAMM (random effects),
  with R-style formulas (`y ~ x1 + s(x2) + (1 | group)`).
- **Multi-backend numerical core** — the same model runs on NumPy, PyTorch,
  or JAX, so switching to GPU is a constructor argument, not a rewrite.
- **9 distribution families** with canonical and custom link functions.

## Evidence: validation as a design requirement

The part I'm most deliberate about: numerical correctness is enforced in CI,
not assumed.

- **Automated differential testing against R and statsmodels** — 20
  family × replica comparisons on every run; maximum observed deviation
  **1.4 × 10⁻¹³** (pure floating-point noise).
- **3,200+ test suite**, with `mypy` and `ruff` clean in CI.
- Every release validates against the reference implementations again; a
  regression that changes coefficients beyond tolerance blocks the build.

## Results

- Published on **PyPI** (v1.0.0), MIT license.
- Up to **141× GPU acceleration** via the PyTorch CUDA backend on
  large-scale fits.
- Used as the reference implementation in my own applied work, where the
  GAMM random-effects machinery handles repeated-measures designs that
  standard gradient boosting cannot model natively.
