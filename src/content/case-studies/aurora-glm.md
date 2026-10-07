---
title: "Aurora-GLM"
subtitle: "GLM, GAM and GAMM in Python — R-style formulas, multi-backend, GPU-accelerated"
description: "A published PyPI framework for statistical modeling with automated numerical validation against R and statsmodels in CI, a 3,379-test suite, and a multi-backend numerical core (NumPy/PyTorch/JAX) with GPU support. GPU speedup claims were re-measured during portfolio preparation: the historical '141×' did not reproduce; the verified figure on an RTX 5070 Ti is 4.5-5.9× at n=50,000, with NumPy faster below n=10,000."
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
    value: "3,379"
    note: "tests collected, per repo README"
  - label: "GPU speedup (verified)"
    value: "5.9×"
    note: "Poisson n=50k, RTX 5070 Ti, 2026-10-07; an earlier 141× claim did not reproduce and was corrected"
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

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Coefficient agreement vs reference implementations (max deviation, log scale)","xLabel":"distribution family","yLabel":"max |Δ coefficient| (log)","labels":["Gaussian","Poisson","Binomial","Gamma"],"datasets":[{"label":"vs statsmodels","data":[1e-11,1e-10,1e-9,2e-6]}],"yLog":true,"values":true,"source":"Aurora-GLM/benchmarks/PERFORMANCE.md"}
</script></div>

- **3,200+ test suite**, with `mypy` and `ruff` clean in CI.
- Every release validates against the reference implementations again; a
  regression that changes coefficients beyond tolerance blocks the build.

## Results

- Published on **PyPI** (v1.0.0), MIT license.
- **GPU acceleration, re-measured**: 4.5× (Gaussian) / 5.9× (Poisson) at
  n=50,000 on an RTX 5070 Ti (median of 5, 2026-10-07). Below n=10,000
  NumPy is faster — the crossover is visible in the data, not asserted.

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"CUDA speedup vs NumPy by problem size (log scale, values < 1 mean NumPy wins)","xLabel":"problem size n","yLabel":"speedup × (log)","labels":["n=1,000","n=5,000","n=10,000","n=50,000"],"datasets":[{"label":"Gaussian","data":[0.24,0.57,0.99,4.5]},{"label":"Poisson","data":[0.21,0.4,0.77,5.9]}],"yLog":true,"values":true,"hline":1,"source":"Aurora-GLM/benchmarks/results/comprehensive_results.json (RTX 5070 Ti, torch 2.11+cu128, 2026-10-07)"}
</script></div>

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Absolute fit time — NumPy vs PyTorch CUDA (seconds, log scale)","xLabel":"problem size n","yLabel":"seconds (log)","labels":["n=1,000","n=5,000","n=10,000","n=50,000"],"datasets":[{"label":"Gaussian · NumPy CPU","data":[0.001,0.0025,0.0047,0.0231]},{"label":"Gaussian · CUDA","data":[0.0042,0.0044,0.0047,0.0051]},{"label":"Poisson · NumPy CPU","data":[0.0026,0.0045,0.0086,0.0679]},{"label":"Poisson · CUDA","data":[0.012,0.0114,0.0112,0.0116]}],"yLog":true,"values":true,"source":"Aurora-GLM/benchmarks/results/comprehensive_results.json (median of 5 runs)"}
</script></div>

**Evidence caveat:** an earlier version of this case study (and the repo's
README/PERFORMANCE.md) claimed "up to 141× GPU acceleration". Re-running
the repo's own benchmark suite on current hardware did not reproduce it —
the original NumPy baseline (4.3 s at n=50,000) came from a far slower
machine than any modern laptop CPU. The claim was corrected everywhere;
the history stays visible, as with the Hawkes Sharpe audit. On CPU,
Aurora's GLM is at parity with statsmodels (which wins at small n, Aurora
at n≥10,000 on Gaussian — measured the same day, same harness).

## Ecosystem position

Where Aurora-GLM sits against the tools it draws inspiration from —
R's **mgcv** and **lme4**, and Python's **statsmodels**:

| Capability | statsmodels | R mgcv | R lme4/nlme | Aurora-GLM |
|---|---|---|---|---|
| GLM (9 families, links) | ✓ | via `glm()` | via `glm()` | ✓ |
| GAM (penalized splines) | ✗ | ✓ | ✗ | ✓ |
| GAMM (random effects) | ✗ | ✓ (`gamm`) | ✓ | ✓ |
| R-style formulas | partial (patsy) | ✓ | ✓ | ✓ |
| NumPy / PyTorch / JAX backends | ✗ | ✗ | ✗ | ✓ |
| GPU acceleration | ✗ | ✗ | ✗ | ✓ (4.5–5.9× at n=50k, verified) |
| Usable from a Python production stack | ✓ | ✗ (R) | ✗ (R) | ✓ |

The honest gap, stated in the repo's own known-limitations section:
systematic test-backed accuracy comparisons against `mgcv`/`lme4` are
**planned, not yet implemented** — automated R validation currently
covers GLM (`glm()`, < 1e-6 coefficient agreement in CI). The GAM/GAMM
rows of this table are capability claims, not accuracy claims.

Aurora-GLM is the right tool when a Python service needs GAM/GAMM
machinery with GPU acceleration; statsmodels remains the right tool for
pure-CPU GLMs with deep diagnostics, and R remains the statistical
reference.
