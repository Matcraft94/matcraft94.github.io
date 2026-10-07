---
title: "Hawkes Order Flow Alpha"
subtitle: "Production-grade multivariate Hawkes processes for high-frequency trading"
description: "O(N) recursive MLE estimation, comprehensive statistical validation, and institutional-grade backtesting of order flow strategies — with honest reporting of synthetic-data limitations."
category: "quantitative-finance"
tags: ["hawkes-processes", "hft", "numba", "cython", "time-series", "backtesting"]
repo: "https://github.com/Matcraft94/ds-projects/tree/develop/hawkes-order-flow"
pubDate: 2026-02-10
featured: true
status: "published"
metrics:
  - label: "Estimation speedup"
    value: "~10,000×"
    note: "recursive MLE vs naive MLE, benchmarked"
  - label: "Fit time (4-dim)"
    value: "~0.5s"
    note: "vs >1h naive"
  - label: "Walk-forward Sharpe"
    value: "-0.35"
    note: "mean across windows, synthetic generator"
stack: ["Python 3.13", "Numba", "Cython", "L-BFGS-B MLE", "Time-series CV", "Bootstrap inference"]
---

## Problem

Multivariate Hawkes processes are the standard model for self- and
cross-excitation in order flow. The bottleneck in practice is estimation:
naive MLE over an $N \times N$ excitation matrix costs $O(N^2)$ per event,
which pushes a 4-dimensional fit past one hour — unusable for research
iteration, let alone anything near real time.

## Method

The core contribution is an **O(N) recursive MLE** implementation (Numba/Cython)
that reformulates the log-likelihood gradient to carry sufficient statistics
forward in time instead of recomputing the full kernel history per event.
Layered on top:

- **Estimator hierarchy** — standard MLE, Fast MLE, Parallel MLE (multi-start
  over cores), and the UltraFast variant for large event sets, with EM as a
  slower reference path.
- **Statistical validation** — branching-ratio/spectral-radius checks for
  stationarity, goodness-of-fit on the estimated compensator, and
  time-series cross-validation rather than a single random split.
- **Bootstrap inference** on estimated parameters, so intervals — not just
  point estimates — drive the trading decision.

## Evidence

| Method | 1K events | 5K events | 10K events |
|---|---|---|---|
| Standard MLE | 30s | 10min+ | hours |
| Fast MLE | 2s | 10s | 30s |
| UltraFast MLE | **~0.5s** | **~2s** | **~5s** |

Benchmarks on a 4-core machine; full numbers in the repo's performance guide
(`docs/PERFORMANCE_GUIDE.md`).

## Results and honest caveats

Two strategy families were backtested — intensity-imbalance and
prediction-based signals. The headline results:

- **Walk-forward out-of-sample (notebook 03): mean Sharpe -0.35** across
  windows, 16.7% of windows positive. The strategies are not profitable
  out-of-sample on the synthetic generator.
- An earlier version of this project reported "Sharpe 86.98, win rate
  62.5%, grade A+". While auditing the project for this portfolio, I traced
  those numbers to two compounding artifacts, since corrected in the repo:
  - the simulated mid-price drifted **on the same order-flow imbalance the
    signal trades** (`drift = imbalance * 0.0025`) — a circular construction
    that guarantees favorable fills;
  - the "Sharpe" annualized per-trade returns with **√98,280 over a
    400-second backtest** — a factor that manufactures any desired number.

  Re-executing the corrected notebook reproduces the 62.5% win rate, but it
  is **8 trades** in total, with a **per-trade t-statistic of 0.78** — far
  below the ~2.0 needed for statistical significance. The impressive-sounding
  win rate and the fake Sharpe describe the same null result.

The corrected notebook reports per-trade statistics instead and states
plainly that no annualized Sharpe is meaningful on this data. I keep this
history visible — in the repo READMEs and here — because a track record of
catching and correcting your own overclaims is worth more to a quantitative
employer than an impressive number.

**What survives scrutiny:** the estimation engine (the ~10,000× speedup is
benchmarked in `docs/PERFORMANCE_GUIDE.md`), the validation methodology
(spectral radius checks, compensator GOF, time-series CV, bootstrap
intervals), and the pipeline discipline.

## Next step: real data

`scripts/download_binance_data.py` fetches public Binance trade history to
run the same pipeline on data with no circular construction — the fair test
the synthetic generator could never provide. Results will be reported here
with the same honesty, in either direction.

## Reproduce

```bash
pip install -e hawkes-order-flow/
jupyter notebook notebooks/03_backtesting.ipynb
```
