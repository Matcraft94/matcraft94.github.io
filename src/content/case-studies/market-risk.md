---
title: "Market Risk Prediction with LSTM Walk-Forward Validation"
subtitle: "LSTM risk forecasting with time-series cross-validation, fold checkpointing, and a transaction-cost-aware backtest"
description: "End-to-end LSTM pipeline for short-horizon market risk prediction: technical-feature engineering, walk-forward validation with a chronological hold-out, per-fold checkpoints, and a volatility-regime backtest. An earlier README claimed Sharpe and drawdown results that no surviving output substantiates; this case study states plainly what the code does and what remains unvalidated."
category: "quantitative-finance"
tags: ["lstm", "time-series", "walk-forward-validation", "risk-management", "backtesting", "pytorch"]
pubDate: 2024-08-10
featured: false
status: "draft"
metrics:
  - label: "Reported Sharpe / accuracy"
    value: "none"
    note: "no logs, notebooks, or metric outputs survive in the repo — deliberately not claimed"
  - label: "Checkpoint artifacts on disk"
    value: "5 fold + best model"
    note: "from an earlier run configuration; the current code path would produce at most 3 folds"
  - label: "Final validation split"
    value: "20% chronological"
    note: "held out from all fold training, used only for final evaluation and backtest"
stack: ["PyTorch (2-layer LSTM)", "scikit-learn TimeSeriesSplit", "pandas / NumPy feature engineering", "Plotly visualization"]
---

## Problem

Short-horizon market-risk prediction: given OHLC bars with tick volume for a
crash-volatility index, forecast the next bar's price level and translate the
forecast into risk-aware trading signals. The emphasis of this project is
evaluation discipline — walk-forward validation and a held-out final period —
rather than a single optimistic backtest.

## Method

- **Features** (`src/feature_engineering.py`, `src/data_processing.py`):
  returns, 20-period rolling volatility, RSI(14), MA20, MA50, ATR(14),
  10-bar momentum, and a 20-bar volume moving average, built from raw
  `open/high/low/close/tick_volume` columns. Input schemas are validated
  explicitly and fail loudly on missing columns.
- **Model** (`src/model.py`): a 2-layer LSTM (hidden size 32, dropout 0.2)
  with a small MLP head, trained with Adam (lr 1e-4) and MSE loss. The
  training loop guards against NaN outputs.
- **Validation** (`main.py`): a chronological 80/20 split reserves the final
  20% as a hold-out. On the first 80%, `TimeSeriesSplit` runs walk-forward
  folds with minimum-size guards that skip degenerate folds; each fold
  trains up to 10 epochs with early stopping (patience 3) and saves its own
  checkpoint (`model_fold_*.pth`), with the best fold-epoch snapshot kept as
  `best_model.pth`. Fold validation losses are summarized as mean ± std, and
  the best model is then scored once on the untouched 20%.
- **Backtest** (`src/backtesting.py`): a volatility-regime rule — short when
  realized volatility exceeds 1.5× its mean, long when below 0.5× — with a
  0.001 transaction cost applied on every position change. It reports total
  return, annualized Sharpe, max drawdown, win rate, and trade count. An
  LSTM-signal path (predicted vs. current price with a ±1% band) exists but
  is only used when a model and scaler are supplied.

## Evidence

What is verifiable from the repository today:

| Artifact | What it substantiates |
|---|---|
| Full pipeline code (`main.py`, `src/`) | the architecture described above |
| 6 checkpoint files (~64 KB each) on disk | a training run completed under an earlier configuration |
| `data/processed/plot_crash*.html` | the visualization module executed against the raw data |

What is **not** in the repository: training logs, loss values, backtest
metric outputs, or notebooks. The 5 per-fold checkpoints also do not match
the current code, which computes `n_splits = min(3, …)` — the artifacts came
from an earlier configuration that ran more folds. Neither the fold losses
nor any Sharpe/drawdown figure those runs produced are recorded anywhere I
can point to.

## Results and honest caveats

An earlier README for this project cited Sharpe and drawdown results and
"early stopping in 10 epochs." I could not trace any of those numbers to a
surviving log, notebook, or output file, so they are **dropped**, not
repeated here. The only performance-adjacent evidence is the existence of
the checkpoints themselves.

Known limitations, stated plainly:

- **Two of the three datasets are dead paths.** `main.py` loads
  `crash300.xlsx`, `crash500.xlsx`, and `crash500_2.xlsx`, but only
  `crash500` is ever processed — and it is confusingly stored in a variable
  named `processed_300`. The other two files are loaded and unused.
- **Per-fold normalization leaks fold statistics.** `MarketDataset`
  z-scores with the mean/std of the entire frame passed in, which includes
  the validation portion of each fold and the target itself. Normalization
  should be fit on training windows only.
- **Target column ambiguity.** The dataset returns column index 0 of the
  numeric frame as the target while the comment says "next close"; which
  column actually sits at index 0 after the date columns are dropped is not
  asserted anywhere.
- **The backtest in `main.py` does not use the trained model.**
  `BacktestStrategy` is instantiated with data only — no model, no scaler —
  so the reported metrics come from the volatility-regime rule alone. The
  LSTM is never scored on the hold-out by the entry point.
- **Metric definitions are rough.** "Sharpe" annualizes with √252
  regardless of the bar frequency of the underlying data (unknown from the
  repo), and drawdown is computed on the cumulative *sum* of returns rather
  than a compounded equity curve.
- **Gradient clipping is a no-op as written.** `clip_grad_norm_` is called
  inside `forward()`, before any backward pass, so it never constrains the
  gradients it is meant to stabilize.

**What survives scrutiny:** the walk-forward evaluation design, per-fold
checkpointing, schema-validated feature engineering, and a backtest skeleton
that at least charges transaction costs — the plumbing of a credible
pipeline, with the numeric results still owed.

## Next step

Wire `best_model.pth` and a properly fitted scaler into the backtest, fit
normalization on training windows only, pin the target column explicitly,
log fold losses and backtest metrics to disk on every run, and record the
results here — in either direction.
