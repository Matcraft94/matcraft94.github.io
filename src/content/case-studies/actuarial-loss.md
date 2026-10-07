---
title: "Actuarial Loss Prediction"
subtitle: "XGBoost + NLP feature engineering for workers' compensation claim costs in R"
description: "An end-to-end R/tidymodels pipeline that predicts ultimate incurred claim cost from tabular, temporal, and free-text claim data, with hyperparameter tuning via Latin hypercube search and error analysis by value segment."
category: "ml-engineering"
tags: ["xgboost", "tidymodels", "r", "feature-engineering", "nlp", "regression", "actuarial"]
pubDate: 2024-11-20
featured: false
status: "draft"
metrics:
  - label: "RMSE (test)"
    value: "25,034"
    note: "ultimate claim cost, USD"
  - label: "MAE (test)"
    value: "7,258"
  - label: "RMSE (train)"
    value: "22,217"
  - label: "Dataset"
    value: "54,000 × 92"
    note: "after feature engineering"
stack: ["R", "tidymodels", "XGBoost", "tidytext", "SnowballC", "vip (SHAP)", "doParallel"]
---

## Problem

Insurers need accurate estimates of ultimate claim cost to set reserves, price
premiums, and manage risk. This project tackles the regression problem of
predicting `UltimateIncurredClaimCost` for workers' compensation claims, using a
course/competition dataset (`Data/actuarial_loss/train.csv`) that the project
documentation compares against Kaggle competition leaderboards. The target is
severely right-skewed: most claims are small, a few are very large, and that
tail drives most of the financial exposure.

## Method

The full pipeline is implemented in R with tidymodels, in `trabajo_final_E_ARIAS.Rmd`:

- **EDA and cleaning** — missing-value analysis (a small share of categorical
  gaps), skewness/kurtosis of the target, and temporal analysis of
  accident-to-report lag. `MaritalStatus` missing values were imputed with the
  mode; missing target values with group means by marital status.
- **NLP on claim descriptions** — free-text `ClaimDescription` fields were
  lowercased, stripped of digits/punctuation, tokenized, stop-word removed, and
  stemmed (SnowballC). The top ~100 stems and bigrams (min frequency 50) became
  binary count features (prefixed `CD_`), plus a per-term severity analysis
  (average claim cost by stem).
- **Feature engineering** — `Days_To_Report` (accident-to-report lag),
  `WeeklyWagesPerHour` (wage-per-hour ratio), `DependentsTotal`, factor
  encoding of marital status, and date columns dropped. Infinite values in the
  target were capped at Q3 + 1.5×IQR bounds.
- **Model** — XGBoost (`reg:squarederror`, L1/L2 = 0.01) tuned over a 25-point
  Latin hypercube grid of trees (100–500), `min_n` (5–20), `tree_depth`
  (3–8), `learn_rate` and `loss_reduction` (log-scaled), selected by 5-fold
  stratified cross-validation on RMSE, parallelized over 7 cores. A tidymodels
  recipe handled normalization, one-hot encoding, near-zero-variance removal,
  and mean/mode imputation.

## Evidence

Reported in the document's evaluation sections:

- **Train**: RMSE 22,216.72, MAE 6,744.16. **Test**: RMSE 25,033.93,
  MAE 7,257.61 — a modest generalization gap indicating slight overfitting but
  stable behavior on unseen data.
- **Variable importance (SHAP-based, via `vip`)** — the dominant predictors are
  the initial estimated claim cost (`InitialIncurredCalimsCost`), weekly wages,
  claimant age, and days-to-report, with text-derived `CD_` features
  contributing beyond the tabular signal.
- **Segment analysis** — errors were broken down by value band
  (<$5k, $5k–$20k, $20k–$50k, >$50k) and by quintile, showing consistent
  accuracy across train/test in the low/middle bands and the expected
  degradation on high-value claims.

## Results

- A single XGBoost model trained on ~54k claims × 92 features reaches a test
  RMSE of ≈25k USD and MAE of ≈7.3k USD on a heavy-tailed target.
- The document positions the result as competitive with Kaggle leaderboard
  approaches, while noting the added value of uncertainty-aware evaluation.
- Practical takeaways identified: initial incurred cost dominates the
  prediction, report lag and wages are secondary drivers, and text features add
  explanatory signal on top of structured fields.

## Honest caveats

- **Leaky split design.** The 80/20 train/test assignment was sampled *before*
  text-feature extraction and target imputation, which were then computed on
  the combined data — so test metrics are mildly optimistic.
- **Target imputation.** Missing ultimate costs were filled with group means,
  which biases the target downward and compresses variance.
- **R² is squared correlation**, not the standard coefficient-of-determination
  definition, in the reported residual statistics.
- **High-value claims remain hard** — the >$50k segment shows the largest
  absolute errors, exactly where reserve accuracy matters most.
- **The Kaggle comparison is qualitative.** No leaderboard score is cited, so
  "competitive with winners" is the author's assessment, not a verified rank.
- **Uncertainty claims outpace the code.** The narrative mentions providing
  uncertainty estimates, but no quantile regression, bootstrap, or interval
  construction appears in the notebook.
- The dataset's exact public-competition provenance could not be verified from
  the repository (no data dictionary or competition link is included).
