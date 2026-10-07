---
title: "Market Risk Prediction with LSTM Walk-Forward Validation"
subtitle: "Auditing and repairing an LSTM risk pipeline — six methodological defects found, fixed, and re-run with honest results"
description: "End-to-end LSTM pipeline for short-horizon market risk prediction on 1-minute bars. While preparing this portfolio I audited the code and found six methodological defects — normalization leakage, wrong target column, a no-op gradient clip, a backtest that never used the trained model, and a Sharpe annualization off by ~2000×. All six are fixed and the pipeline re-run; the corrected result is an honest negative: cost drag, not alpha."
category: "quantitative-finance"
tags: ["lstm", "time-series", "walk-forward-validation", "risk-management", "backtesting", "pytorch", "code-audit"]
pubDate: 2024-08-10
featured: false
status: "draft"
metrics:
  - label: "Backtest total return"
    value: "-37.3%"
    note: "holdout, model signal, 0.1% cost per flip — cost drag explains it"
  - label: "Position flips"
    value: "14,922"
    note: "≈ one per bar: the model signal overtrades to death"
  - label: "Fold val loss (mean ± std)"
    value: "0.374 ± 0.486"
    note: "3 walk-forward folds; middle regime folds badly"
  - label: "Final holdout loss"
    value: "5.43"
    note: "regime shift: the model does not transfer to the last 20%"
stack: ["PyTorch (2-layer LSTM)", "scikit-learn TimeSeriesSplit", "pandas / NumPy feature engineering", "Plotly visualization"]
---

## Problem

Short-horizon market-risk prediction: given OHLC bars with tick volume for
a crash-volatility synthetic index, forecast the next bar's close and
translate the forecast into risk-aware trading signals. The emphasis is
evaluation discipline — walk-forward validation and a chronological
hold-out — rather than a single optimistic backtest.

Data: 94,858 one-minute bars of crash500 (2022-04-25 → 2022-06-30,
24/7 market), reduced to 74,865 rows × 13 features after engineering.
The 80/20 chronological split reserves 14,973 bars as a final hold-out
that no fold training ever sees.

## Audit: six defects found while preparing this portfolio

The original pipeline had architectural ambition but six concrete
methodological defects. Each is fixed in the repo (commit `2f1a79c` on
`develop`) and listed here because this is the actual capability the
case study demonstrates — catching these is the job:

| # | Defect | Fix |
|---|---|---|
| 1 | `crash300` and `crash500_2` were loaded and never used; crash500 lived in variables named `processed_300` | load only the dataset the pipeline uses; rename |
| 2 | The training target was **column index 0 of the numeric frame — `open`** — while the comment said "next close" | explicit `target_col='close'` parameter |
| 3 | Normalization used the mean/std of whatever frame the dataset was built from, leaking validation and holdout statistics into every fold | scaler fitted on the **training fold only** (`MarketDataset.fit_scaler`) and passed everywhere; persisted with the model |
| 4 | `clip_grad_norm_` was called inside `forward()` — before any backward pass, a no-op | moved to after `loss.backward()` |
| 5 | The backtest was instantiated with **no model and no scaler**, so reported metrics came from the volatility-regime rule alone; the trained LSTM never participated | `BacktestStrategy` now receives the best fold model and scaler; predictions are de-normalized to price scale before signal generation |
| 6 | "Sharpe" annualized with a hardcoded √252 on **1-minute bars** — an inflation of ~2000×; drawdown used a summed-return curve | `periods_per_year` is an explicit parameter (525,960 here); compounded equity curve for return and drawdown |

Reproducibility was also pinned: `torch`/`numpy` seeds set to 42.

## Results after the fix (verified re-run)

Walk-forward folds (chronological, expanding window):

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Validation loss by fold and final holdout (normalized MSE on next close, log scale)","xLabel":"evaluation segment","yLabel":"MSE loss (log)","labels":["fold 1 val","fold 2 val","fold 3 val","final holdout"],"datasets":[{"label":"validation loss","data":[0.016,1.0605,0.0443,5.4251]}],"yLog":true,"values":true,"source":"market-risk-analysis re-run, seed 42, commit 2f1a79c"}
</script></div>

- Fold validation losses 0.016 / 1.061 / 0.044 (mean 0.374 ± 0.486). The
  middle fold fails by an order of magnitude — a volatility regime the
  model trained on the earlier period cannot represent.
- Final holdout loss **5.43**: distribution shift in the last 20% is
  severe enough that the model is off the training manifold entirely.

Backtest on the holdout, now actually driven by the LSTM:

- **14,922 position flips over 14,913 bars** — the ±1% prediction band
  flips the signal almost every bar.
- **Total return -37.3%**, max drawdown -37.3%. With a 0.1% cost per
  flip, the cost drag alone is ≈ 15 points of pure bleed; the strategy
  loses to friction, not to direction.
- Win rate 86.8% of bars positive — a classic overtrading pathology:
  small per-bar wins, large per-flip costs. The annualized Sharpe at
  the true bar frequency (525,600/yr) is -48; the number is reported
  only to show the wiring, not as a performance claim.

## Honest caveats

- The model signal as specified (threshold on next-close prediction) has
  no edge at 1-minute horizon on this instrument — the honest result is
  negative, and the corrected pipeline now *produces* that result instead
  of hiding it.
- The corrected numbers replace an earlier README that cited Sharpe and
  drawdown figures traceable to no surviving output; those claims were
  dropped in the audit, not repeated.
- What survives scrutiny: the evaluation design (walk-forward +
  untouched holdout), per-fold checkpointing, schema-validated feature
  engineering, a cost-aware backtest, and an audit trail that converts
  a broken pipeline into a verifiable negative result.

## Reproduce

```bash
cd market-risk-analysis
uv venv .venv && uv pip install -e .  # torch CPU, pandas, scikit-learn, plotly
python main.py   # ~10 min on CPU; seeds pinned
```
