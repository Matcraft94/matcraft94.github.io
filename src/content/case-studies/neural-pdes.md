---
title: "Neural PDEs Solver"
subtitle: "Physics-informed networks and neural ODEs for forward and inverse differential-equation problems"
description: "A notebook-based research sandbox covering PINNs with domain decomposition and energy penalties for the double pendulum, NLLSQ/VarPro inverse parameter estimation for a Poisson problem, a neural surrogate for Oregonator reaction kinetics, and SIR parameter inference with Pyro SVI — with all reported numbers taken from actual training logs."
category: "scientific-ml"
tags: ["pinns", "neural-odes", "pdes", "pytorch", "inverse-problems", "scientific-machine-learning"]
repo: "https://github.com/Matcraft94/ds-projects/tree/develop/neural-pdes-solver"
pubDate: 2025-06-15
featured: false
status: "published"
metrics:
  - label: "Inverse Poisson α error (NLLSQ)"
    value: "3.7%"
    note: "true α = 1, recovered α ≈ 0.965"
  - label: "Double pendulum PINN loss"
    value: "19.5 → 0.024"
    note: "first-to-logged-epoch training loss, t ∈ [0, 2]"
  - label: "ANODE test loss (concentric circles)"
    value: "5.7e-6"
    note: "1 augmented dimension; toy 2D benchmark"
  - label: "VarPro α recovery"
    value: "failed"
    note: "converged to α ≈ −0.79 vs true α = 1 (178.7% error)"
stack: ["Python", "PyTorch", "Pyro", "torchdiffeq (TorchDyn as reference)", "SciPy solve_ivp", "CUDA"]
---

## Problem

Differential equations model most of the physical world, but the classical
workflow splits awkwardly across tools: forward solvers (Runge–Kutta, finite
elements) require the equation *and* its parameters, while in practice we
often have measurements and need to infer the equation's parameters, or want
a differentiable surrogate of the solver itself. This project is a
notebook-based exploration of neural approaches to both sides of that gap:

- **Forward problems** — can a network trained on the residual of the
  equations reproduce the trajectory of a chaotic system (double pendulum)?
- **Inverse problems** — given sparse measurements of the solution, can we
  recover an unknown PDE coefficient (the anisotropy parameter α of a
  Poisson equation)?
- **Dynamics from data** — can neural ODEs, including augmented variants,
  learn dynamics from synthetic trajectories (Oregonator/BZ chemistry, 2D
  classification flows)?

## Method

Five independent notebooks, each self-contained PyTorch/Pyro code:

- **Double pendulum PINN with domain decomposition.** The time domain
  [0, 2] is split into 5 subdomains, each with its own residual network
  (128 hidden units, 8 residual blocks, tanh activations). Loss combines an
  initial-condition term (weight 0.99), the equations-of-motion residual
  with per-equation relative scaling, continuity penalties at subdomain
  interfaces, and a soft energy-conservation penalty (0.1 weight, penalizing
  variation of kinetic + potential energy along the predicted trajectory).
  Reference trajectories come from `scipy.integrate.solve_ivp`.
- **Inverse Poisson via separable least squares.** For
  u_xx + α·u_yy = f with manufactured solution u = sin(πx/2)·sin(πy/2) and
  unknown α (true value 1), two classical separable-nonlinear-least-squares
  strategies are implemented on top of a random-hidden-layer network with
  the hidden layer frozen:
  **NLLSQ** (joint Adam over the linear output layer and α) and
  **VarPro** (α eliminated in closed form via a scalar normal equation each
  step; Adam trains only the linear output head).
  A GPU memory manager estimates feasible collocation-grid sizes before
  training (8 GB card; 120 points used, ~200 recommended max).
- **SIR parameter inference with Pyro.** A stochastic variational inference
  (SVI, Trace_ELBO) fit of the transmission/recovery rates β, γ against US
  COVID-19 daily case data (`data/covid/us_covid19_daily.csv`), with a
  14-day delayed-recovery bookkeeping for the recovered compartment.
- **Neural surrogate for Oregonator (BZ) reaction kinetics.** The
  Belousov–Zhabotinsky reaction (Oregonator ODE system) is integrated with a
  hand-written RK4 to generate synthetic concentrations, and a network is
  trained to predict species concentrations from (t, u) pairs — a
  regression surrogate, not a full reaction–diffusion–advection solve.
  (The notebook's own text describes an RDA PDE, but the code integrates a
  temporal ODE: the diffusion/advection coefficients are defined and never
  used — the simplification is real, just not stated by the notebook.)
- **Neural ODEs from first principles.** An educational notebook (in
  Spanish) building Euler/RK4 integrators, phase portraits, then NODEs with
  the adjoint method (torchdiffeq/TorchDyn), reproduced on three toy 2D
  classification benchmarks: two moons, concentric circles with a plain
  NODE, and concentric circles with an Augmented NODE (ANODE, +1 dimension).

## Evidence: what the training logs actually show

All numbers below are read from the executed notebook outputs, not restated
from memory:

- **Inverse Poisson (120 collocation points, 1000 epochs each).** NLLSQ
  reached **α = 0.9645 at epoch 900 — a 3.71% parameter error** — still
  descending (≈ 0.963 by the final step), so "converged" is generous: there
  is no stopping criterion, and solution quality is modest (MSE 0.056,
  R² 0.436). VarPro diverged to **α ≈ −0.786, a 178.7% parameter error** —
  with the caveat that this implementation is a degenerate variant (the
  closed-form update ignores the measurement data and α is never a trainable
  parameter), so it is not a fair verdict on the VarPro method itself. Both
  runs took ~47 s and under 0.3 MB peak memory.
- **Double pendulum PINN.** Recorded training loss went from 19.50 at epoch
  0 to 0.024 at epoch 100 (of 200; the final loss is not printed), trained
  on GPU. The comparison against the `solve_ivp` reference is **visual
  only** — the notebook contains no numerical error metric, only overlay
  plots for θ₁, θ₂, ω₁, ω₂. Two data-handling bugs (2026-10-07 audit) limit
  what the loss certifies: the initial-condition loss is evaluated at a
  random `t[0]` because the DataLoader shuffles batches, and the
  energy-variation penalty differences unordered points, so neither term
  measures what it claims.
- **Neural ODE classification benchmarks.** Re-run 2026-10-07 on an
  RTX 5070 Ti (seed 42); the notebook now persists metrics through an
  added `FINAL_METRICS` print, since its progress bars alone store no
  values. Two moons, plain NODE (200 epochs): test accuracy **1.0**,
  test loss **2.18e-3**. Concentric circles, plain NODE (300 epochs):
  test accuracy **0.97** but test loss **0.0715** — comparable accuracy
  yet four orders of magnitude worse loss than the ANODE, the
  quantitative fingerprint of the documented topological "cheat"
  (stretching the plane instead of separating the annuli, matching
  Dupont et al. 2019). Concentric circles, ANODE with one augmented
  dimension (100 epochs): test accuracy **1.0**, test loss **5.69e-6**.
- **Oregonator surrogate.** Training loss plateaued at ≈ 0.078 after ~100
  epochs (1000 epochs run); test loss 0.346 on the held-out tail of the
  trajectory. Caveat: the MSE is computed on an `[N,1]` vs `[N]` broadcast in
  **both** the train and test cells (PyTorch warns explicitly in the
  notebook), so each figure averages an N×N broadcast matrix rather than the
  true per-point MSE — mathematically a pessimistic upper bound
  (`MSE_broadcast = MSE_real + 2·Cov`), so direction (plateau,
  generalization gap) is meaningful, the absolute values less so. No seed or
  weights are saved, so the numbers are not reproducible as-is.

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Oregonator surrogate — train plateau vs held-out test loss (generalization gap; broadcast-MSE caveat applies)","xLabel":"evaluation set","yLabel":"MSE loss (broadcast caveat)","labels":["train (plateau, ~epoch 100)","test (held-out tail)"],"datasets":[{"label":"MSE","data":[0.078,0.346]}],"values":true,"source":"neural-pdes-solver/RDA-DN-NA.ipynb cells 23-24"}
</script></div>
- **SIR / COVID.** The SVI loss stayed flat at ≈ 1.597e7 across all printed
  iterations and the inferred β and γ both returned 0.20000000298 — exactly
  the initialization. The inference did not converge.

## Results

- A working **domain-decomposed PINN** for the double pendulum that fits the
  reference trajectory over t ∈ [0, 2] to a logged loss of 0.024, with
  interface continuity and an energy-variation penalty built into the loss.
- A **validated-success / documented-failure pair** for inverse problems:
  NLLSQ recovers the Poisson coefficient α within 3.7%, while the VarPro
  variant as implemented converges to a physically wrong value — a useful,
  concrete illustration that variable projection is not automatically the
  better option in this PDE setting.
- A **reproduction of the known NODE topology limitation** (homeomorphism
  constraint) and its resolution via augmentation, verified numerically on
  the canonical concentric-circles benchmark.

## Honest caveats

- **Everything here is demonstrated on synthetic or benchmark problems.** The
  Poisson problem uses a manufactured solution; the Oregonator data is
  generated by my own RK4; the NODE experiments are 2D toy datasets. The
  only real-data experiment (COVID SIR inference) did not converge, and I
  report it as such rather than hiding it.
- The inverse-Poisson solution-field metrics are modest (MSE 0.056, R² 0.44
  on NLLSQ), so the 3.7% α error should be read as "parameter recovered
  correctly despite an imperfect surrogate field", not as a high-fidelity
  solver.
- The VarPro run's failure to recover α is not a literature claim — it is
  what this particular implementation did on this problem instance.
- The double pendulum energy penalty is computed over shuffled minibatch
  order rather than the time-ordered trajectory, so it regularizes energy
  variation only in expectation over batches, not pointwise along the orbit.
- Results were produced on a single 8 GB consumer GPU; no seed sweeps,
  uncertainty quantification, or cross-run variance analysis were performed.
- The notebooks are research code: warnings left unfixed, some Spanish
  commentary, and no packaging or tests. This is an exploratory sandbox,
  not a shipped library.
