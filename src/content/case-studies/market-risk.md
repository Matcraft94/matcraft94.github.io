---
title: "Market Risk Prediction with LSTM Walk-Forward Validation"
subtitle: "Auditing and repairing an LSTM risk pipeline — seven methodological defects found, fixed, and re-run with honest results"
description: "End-to-end LSTM pipeline for short-horizon market risk prediction on 1-minute bars. While preparing this portfolio the code was audited twice: first six defects (normalization leakage, wrong target column, no-op gradient clip, a backtest that never used the trained model, ~2000x Sharpe annualization) and then a seventh found by independent review — an RSI NaN bug whose dropna silently deleted 21% of bars and biased every result. All seven are fixed; the corrected pipeline shows the model has no edge: the backtest is buy-and-hold of a flat market."
category: "quantitative-finance"
tags: ["lstm", "time-series", "walk-forward-validation", "risk-management", "backtesting", "pytorch", "code-audit"]
pubDate: 2024-08-10
featured: false
status: "published"
metrics:
  - label: "Backtest total return"
    value: "-0.20%"
    note: "holdout ≈ buy-and-hold of a -0.18% flat market; ~5 position changes, costs negligible"
  - label: "Max drawdown"
    value: "-5.0%"
    note: "intraperiod fluctuation of the always-long position"
  - label: "Fold val loss (mean ± std)"
    value: "0.336 ± 0.436"
    note: "3 walk-forward folds; the middle regime folds ~100x worse"
  - label: "Final holdout loss"
    value: "4.55"
    note: "regime shift persists after the bias fix — the model does not transfer"
stack: ["PyTorch (2-layer LSTM)", "scikit-learn TimeSeriesSplit", "pandas / NumPy feature engineering", "Plotly visualization"]
---

## Problem

Short-horizon market-risk prediction: given OHLC bars with tick volume for
a crash-volatility synthetic index, forecast the next bar's close and
translate the forecast into risk-aware trading signals. The emphasis is
evaluation discipline — walk-forward validation and a chronological
hold-out — rather than a single optimistic backtest.

Data: 94,858 one-minute bars of crash500 (2022-04-25 → 2022-06-30, 24/7
market), reduced to 94,789 rows × 13 features after engineering (the RSI
fix below restored the 21% of rows an earlier bug had silently deleted).
The 80/20 chronological split reserves 18,958 bars as a final hold-out
that no fold training ever sees.

## Audit: seven defects found and fixed

This case study exists because the pipeline was audited — twice. The
first pass found six defects; an independent reviewer then caught a
seventh that invalidated the first re-run's interpretation. Each fix is
in the repo (commits `2f1a79c` and the RSI follow-up on `develop`):

| # | Defect | Fix |
|---|---|---|
| 1 | `crash300` and `crash500_2` were loaded and never used; crash500 lived in variables named `processed_300` | load only the dataset the pipeline uses; rename |
| 2 | The training target was **column index 0 of the numeric frame — `open`** — while the comment said "next close" | explicit `target_col='close'` parameter |
| 3 | Normalization used the mean/std of whatever frame the dataset was built from, leaking validation and holdout statistics into every fold | scaler fitted on the **training fold only** (`MarketDataset.fit_scaler`) and passed everywhere; persisted with the model |
| 4 | `clip_grad_norm_` was called inside `forward()` — before any backward pass, a no-op | moved to after `loss.backward()` |
| 5 | The backtest was instantiated with **no model and no scaler**, so reported metrics came from the volatility-regime rule alone; the trained LSTM never participated | `BacktestStrategy` now receives the best fold model and scaler; predictions are de-normalized to price scale before signal generation |
| 6 | "Sharpe" annualized with a hardcoded √252 on **1-minute bars** — an inflation of ~2000×; drawdown used a summed-return curve | `periods_per_year` is an explicit parameter (525,600 here); compounded equity curve for return and drawdown |
| 7 | **RSI returned NaN whenever the average loss was zero** — including strong uptrends where RSI is 100. A downstream `dropna()` then deleted **19,944 bars (~21%)**, concentrated in upward stretches: every fold, the holdout, and the backtest ran on a biased subsample whose compounded return was -37% while the real market was -0.18% | `rs = gain / loss` under errstate: gain/0 → ∞ → RSI = 100; only genuine 0/0 stays NaN. The full 94,789-row frame is retained |

Defect 7 is the instructive one: it was invisible in any single number —
losses converged, plots looked reasonable — and it manufactured a market
trend that did not exist. It surfaced only when a reviewer recomputed the
backtest arithmetic and asked why a "risk model" was long 100% of the
time in a crashing frame.

## Results after all fixes (verified re-run, seed 42)

Walk-forward folds (chronological, expanding window):

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Validation loss by fold and final holdout (normalized MSE on next close, log scale)","xLabel":"evaluation segment","yLabel":"MSE loss (log)","labels":["fold 1 val","fold 2 val","fold 3 val","final holdout"],"datasets":[{"label":"validation loss","data":[0.007,0.9514,0.0491,4.5454]}],"yLog":true,"values":true,"source":"market-risk-analysis re-run after RSI fix, seed 42"}
</script></div>

- Fold validation losses 0.0070 / 0.9514 / 0.0491 (mean 0.336 ± 0.436).
  The middle fold fails by **two orders of magnitude** — a volatility
  regime the model trained on earlier data cannot represent. This
  regime instability is real and survives the bias fix.
- Final holdout loss **4.55**: the last 20% of the series is far outside
  the training distribution. The model's predictions there are
  effectively unmoored.

Backtest on the holdout, driven by the LSTM:

- The model signal is **long ~100% of the holdout** (14,917 long bars,
  5 short, 51 flat — about five position changes in total). This is not
  overtrading; it is a prediction that sits just above the long
  threshold almost everywhere.
- **Total return -0.20%** against a market that returned -0.18%
  close-to-close over the same period. Transaction costs (0.1% per
  change) are negligible at five changes. **Max drawdown -5.0%**
  reflects the intraperiod fluctuation of an always-long position.
- The honest reading: corrected for the selection bias, the strategy is
  buy-and-hold of a flat market. The model contributes no directional
  edge at the 1-minute horizon on this instrument — an earlier "-37%
  by cost drag" narrative was an artifact of defect 7, and the first
  draft of this very case study repeated that artifact until the
  reviewer caught it.

## Honest caveats

- The corrected numbers replace an earlier README that cited Sharpe and
  drawdown figures traceable to no surviving output; those claims were
  dropped in the audit, not repeated.
- The win-rate-style figure printed by the backtest (positive-return
  bars / non-zero bars, 0.895) describes the underlying market, not
  model skill — the position barely changes.
- What survives scrutiny: the evaluation design (walk-forward +
  untouched holdout), per-fold checkpointing, schema-validated feature
  engineering, a cost-aware backtest, and an audit trail that survived
  its own audit — including a correction of this case study's first
  published interpretation.

## Reproduce

```bash
cd market-risk-analysis
uv sync                 # pyproject.toml pins torch, pandas, scikit-learn, plotly
uv run python main.py   # ~15 min on CPU; seeds pinned to 42
```
