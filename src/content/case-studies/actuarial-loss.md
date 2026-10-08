---
title: "Actuarial Loss Prediction"
subtitle: "XGBoost + NLP feature engineering for workers' compensation claim costs in R"
description: "An end-to-end R/tidymodels pipeline that predicts ultimate incurred claim cost from tabular, temporal, and free-text claim data, with hyperparameter tuning via Latin hypercube search and error analysis by value segment."
category: "ml-engineering"
tags: ["xgboost", "tidymodels", "r", "feature-engineering", "nlp", "regression", "actuarial"]
repo: "https://github.com/Matcraft94/ds-projects/tree/develop/actuarial-loss-prediction"
pubDate: 2024-11-20
featured: false
status: "published"
metrics:
  - label: "RMSE (test)"
    value: "25,034"
    note: "ultimate claim cost, USD"
  - label: "MAE (test)"
    value: "7,258"
  - label: "RMSE (train)"
    value: "22,217"
  - label: "Dataset"
    value: "54,000 × ~115"
    note: "after text feature engineering (rendered dim); tabular + ~100 text stems"
stack: ["R", "tidymodels", "XGBoost", "tidytext", "SnowballC", "vip (gain importance)", "doParallel"]
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

The full pipeline is implemented in R with tidymodels, in `analysis.Rmd`
(renamed from the original `trabajo_final_E_ARIAS.Rmd`):

- **EDA and cleaning** — missing-value analysis (a small share of categorical
  gaps), skewness/kurtosis of the target, and temporal analysis of
  accident-to-report lag. `MaritalStatus` missing values were imputed with the
  mode; missing target values with group means by marital status.
- **NLP on claim descriptions** — free-text `ClaimDescription` fields were
  lowercased, stripped of digits/punctuation, tokenized, stop-word removed, and
  stemmed (SnowballC). The top ~100 stems (min frequency 50) became stem-count
  features (prefixed `CD_`); bigrams were frequency-analyzed only, not used as
  model features. A per-term severity analysis (average claim cost by stem)
  accompanied the text features.
- **Feature engineering** — `Days_To_Report` (accident-to-report lag),
  `WeeklyWagesPerHour` (wage-per-hour ratio), `DependentsTotal`, factor
  encoding of marital status, and date columns dropped. Defensive capping
  code for infinite target values exists in the pipeline (none were found
  in the data — a no-op on this dataset).
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
- **Variable importance (gain-based, via `vip`)** — the dominant predictor by
  far is the initial estimated claim cost (`InitialIncurredCalimsCost`, gain
  0.879), followed by the engineered wage-per-hour ratio (0.024), weekly
  wages, claimant age, and text stems (`CD_hand` 0.032 — second overall —
  `CD_back`, `CD_strain`, `CD_lacer`, `CD_struck`). The text features carry
  signal beyond the tabular fields. Note: `vip::vi()` for xgboost without an
  explicit method reports **gain** importance, not SHAP — the source
  document's "SHAP" plot subtitle is an overclaim inherited from the original
  notebook.

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"XGBoost gain importance — one tabular cost field dominates; engineered wage ratio and text stems follow (log scale)","xLabel":"feature","yLabel":"gain importance (log)","labels":["InitialIncurredCalimsCost","CD_hand","WeeklyWagesPerHour","WeeklyWages","Age","CD_back","HoursWorkedPerWeek","CD_strain","CD_lacer","CD_struck"],"datasets":[{"label":"gain importance","data":[0.879,0.032,0.024,0.016,0.01,0.009,0.004,0.004,0.004,0.003]}],"yLog":true,"values":true,"source":"analysis.html variable-importance table (test set)"}
</script></div>
- **Segment analysis** — errors were broken down by value band
  (<$5k, $5k–$20k, $20k–$50k, >$50k) and by quintile, showing consistent
  accuracy across train/test in the low/middle bands and the expected
  degradation on high-value claims.

## Results

- A single XGBoost model trained on ~54k claims reaches a test
  RMSE of ≈25k USD and MAE of ≈7.3k USD on a heavy-tailed target.
- The document positions the result as competitive with Kaggle leaderboard
  approaches, while noting the added value of uncertainty-aware evaluation.
- Practical takeaways identified: initial incurred cost dominates the
  prediction; the engineered wage-per-hour ratio and weekly wages are
  secondary drivers; and text stems (led by `CD_hand`) add explanatory
  signal on top of structured fields.

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
- **The dataset's exact public-competition provenance could not be verified from
  the repository (no data dictionary or competition link is included).**
  (Update 2026-10-07: identified as the Kaggle competition *Actuarial Loss
  Prediction* — workers' compensation, 54,000 training claims — and the data
  re-downloaded from a public mirror; header matches, including the upstream
  `CalimsCost` typo.)
- **Numbers are environment-bound.** A 2026-10-07 re-run with identical seeds
  (123/345) and the mirror data executes the full pipeline but lands on
  different figures (train/test RMSE 29,032/26,355 vs the original
  22,217/25,034; top gain 0.838 vs 0.879) — package-version drift and/or row
  ordering. The published metrics belong to the original 2025 environment,
  preserved in the rendered report, which remains the source of record.

## What improving the model taught me (2026-10-07)

After the audit I ran a controlled three-arm experiment (same container,
data, seed; `improved_model.R` in the repo): the original design with only
the audit fixes, the same plus a `log1p` target and TF-IDF text features,
and an XGBoost Tweedie variant. The honest scoreboard: a **log-target
model cuts MAE to 6,050 (−17% vs the published model)** and quintile MAE
for cheap-to-mid claims drops 3–5×, because the squared-dollar objective
had been ignoring the majority of claims; the **Tweedie variant posts the
best RMSE (22,871) and R² (0.344)**. Equally instructive: fixing the leaky
split *alone* made things worse — the real gains came from matching the
objective to the loss distribution, not from methodology hygiene. The
expensive-claims segment (>Q5) remains the dominant, unsolved error.

A second round (`glm_gam_experiment.R`) added classic actuarial families
under the identical protocol — elastic-net GLM, Gamma GLM, mgcv GAM, GAMM
with a year random effect, and a two-part **hurdle** model (P(claim>$50k) ×
Gamma severity). The hurdle posts the project's best RMSE (22,800) and R²
(0.348); the GAM's splines beat the linear GLM by 10k RMSE but lose to
boosting on MAE; the year random effect contributes exactly nothing (GAM ≡
GAMM — thousands of claims per year collapse the RE variance); the Gamma
GLM diverged even winsorized (documented failure). No family cracks the
expensive-claims quintile — ~25k MAE everywhere, the segment where reserve
accuracy actually matters.
