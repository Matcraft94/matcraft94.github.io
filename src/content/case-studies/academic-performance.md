---
title: "Academic Performance Prediction"
subtitle: "Early-warning detection of student dropout with LightGBM"
description: "A binary early-warning classifier for student dropout on the UCI 'Predict students' dropout and academic success' dataset: 13 engineered academic and socioeconomic features, random-search hyperparameter optimization under 5-fold CV, and an ensemble of fold models reaching 0.88 accuracy on 885 held-out students — with an honest look at the 0.79 dropout-recall caveat and at the label-encoder leakage in the original notebook."
category: "ml-engineering"
tags: ["lightgbm", "education", "classification", "feature-engineering", "gpu"]
pubDate: 2024-05-12
featured: false
status: "published"
metrics:
  - label: "Held-out test accuracy"
    value: "0.88"
    note: "885 students, untouched 20% test split"
  - label: "Cross-validation accuracy"
    value: "0.868 ± 0.011"
    note: "5-fold stratified, training set only"
  - label: "Dropout recall"
    value: "0.79"
    note: "1 in 5 at-risk students still missed"
  - label: "Dataset"
    value: "4,424 students"
    note: "32.1% dropout rate (1,421 students)"
stack: ["Python", "LightGBM (GPU)", "scikit-learn", "PyTorch AMP autocast", "pandas", "Plotly"]
---

## Problem

Universities lose roughly a third of enrolled students to dropout, and the
earlier an institution can identify at-risk students, the cheaper and more
effective the intervention. The goal here was a binary early-warning model:
given a student's demographics, socioeconomic context, and first-year
academic record, predict whether they will drop out.

The data is the public UCI dataset *Predict students' dropout and academic
success* — 4,424 students at Portuguese higher-education institutions, with
34 attributes covering marital status, nationality, parental qualifications,
scholarships, tuition status, macroeconomic indicators (unemployment,
inflation, GDP), and per-semester curricular performance. Of the 4,424
students, 1,421 (32.1%) dropped out. The original three-class target
(Dropout / Enrolled / Graduate) was binarized into Dropout (0) vs.
non-dropout (1).

## Method

The full pipeline lives in a single reproducible notebook, structured as an
EDA class and a modeling class:

- **Exploratory analysis first.** Demographic, academic, economic, and
  family-background breakdowns of dropouts (Plotly), including a
  course-level dropout-rate ranking and correlation analysis — used to
  understand the population before modeling, not to select features by eye.
- **Feature engineering.** 13 derived features: first-semester approval and
  attendance rates, a grade-per-evaluation ratio, an academic load index, an
  `economic_stress` interaction (unemployment × (1 + inflation) / (GDP + 1)), a
  `financial_status` composite (tuition paid × non-debtor), parental
  qualification sums, and scholarship-by-economic-stress interactions.
- **Preprocessing, with one flaw (see caveats).** Six categorical
  features were label-encoded. The notebook also *defines* top-k selection
  (`select_features`) and multicollinearity pruning (`remove_multicollinearity`,
  0.75 threshold) helpers — but never calls them: they are dead code, and the
  model trains on the full encoded feature set.
- **Hyperparameter search.** 100 random combinations sampled from a grid
  over `n_estimators`, `learning_rate`, `max_depth`, `num_leaves`,
  `colsample_bytree`, and `min_child_samples` — all with GOSS boosting and
  balanced class weights — each scored by 5-fold CV accuracy on the training
  set only (~29 s per trial on GPU, 48 min total). The best combination
  averaged **0.8706** CV accuracy.
- **Final model.** `LGBMClassifier` with GOSS boosting, `n_estimators=300`,
  `learning_rate=0.07`, `max_depth=12`, `num_leaves=55`,
  `colsample_bytree=0.85`, `min_child_samples=12`, balanced class weights,
  early stopping (30 rounds), trained under 5-fold stratified CV with
  `random_state=42` throughout. Per-fold predicted probabilities on the test
  set were **averaged into a 5-model ensemble**.

**Validation protocol:** an 80/20 train/test split (`random_state=42`) held
out 885 students *before* any fitting. All search, selection, and CV happened
on the 3,539-student training set; reported test metrics are the ensemble's
predictions on the untouched 885.

## Evidence

Numbers below are copied from the executed notebook outputs, not restated
from memory:

- **5-fold CV on the training set** (~708 validation students per fold,
  707–708 across folds):
  fold accuracies 0.856, 0.884, 0.879, 0.859, 0.864 →
  **mean 0.8683 ± 0.0111**, printed by the notebook as
  `Precisión media del CV: 0.8683 ± 0.0111`.
- **Held-out test set** (885 students: 271 dropouts, 614 non-dropouts):
  **accuracy 0.88**, precision 0.91, recall 0.92, F1 0.92 on the positive
  (non-dropout) class — i.e., the 88% figure is real and corresponds to a
  genuinely untouched split.
- **Per-class on test:** non-dropout precision/recall 0.91/0.92; dropout
  precision/recall 0.82/0.79. A normalized confusion matrix was generated.
- **Majority-class baseline** on the test set is 614/885 ≈ 0.69, so 0.88 is
  a real lift, not a class-prior artifact.

## Results

- A deployable early-warning score: every student receives a calibrated
  dropout probability (`Dropout_Prob`), with an ensemble-averaged estimate
  from five models rather than a single fit.
- The modeling choices were validated rather than guessed: the random search
  showed flat response surfaces across the grid (e.g., 0.865–0.866 across
  all `n_estimators` values), i.e., performance is robust to the exact
  hyperparameters, not a lucky draw.

## Honest caveats

- **Recall on the minority class is the weak point.** The model catches 79%
  of actual dropouts on the test set — about 1 in 5 at-risk students is
  still missed. For an intervention tool, that is arguably the most
  expensive error, and this accuracy figure should not be read as "we find
  almost all at-risk students."
- **Minor target leakage in encoding.** The label encoders were fit on the
  concatenated train+test data (a code-path override of the initial
  train-only encoding). Since encodings are integer IDs with no ordinal
  semantics for LightGBM splits, the practical impact is negligible — but it
  is a protocol flaw, and a production version would fit encoders on the
  training fold only.
- **Search-on-CV optimism.** The hyperparameter search was scored by the
  same kind of 5-fold CV it later reports, all inside the training set, so
  the 0.868 CV figure is mildly optimistic as an estimate of search-selected
  configurations. No separate validation split was held out for selection.
  (An earlier version of this case study described a top-20 feature
  selection with the same issue — that selection exists only as unused
  helper functions in the notebook and never ran.)
- **Single split, single seed.** Results rest on one 80/20 split with
  `random_state=42`. The tight fold variance (±0.011) suggests stability,
  but a repeated-CV or nested-CV estimate would be more defensible.
- **Dataset vintage.** The UCI dataset records students from an earlier
  enrollment period with macroeconomic context baked in; macro features
  (GDP, unemployment) would need retraining on contemporary data before any
  real deployment.
- PyTorch AMP autocast was used for GPU plumbing around LightGBM; the
  `Dataset`/`DataLoader` scaffolding in the notebook is never instantiated
  and no neural network was trained — the final model is gradient boosting
  throughout.
