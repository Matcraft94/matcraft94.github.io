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

- **Inverse Poisson (120 collocation points, re-run 2026-10-07 with a correct
  VarPro).** The re-implementation exposed that **the benchmark itself is
  α-unidentifiable**: the manufactured source f(α) shares its α with the
  coefficient, so the PDE residual vanishes for *every* α at the true
  solution. Two consequences, both machine-verified. VarPro (proper
  Golub–Pereyra: exact elimination of the linear head + exact 1-D α step)
  recovers the **solution** to machine precision — R² 1.0, MSE 3.2e-13,
  9.4 s (10× faster than NLLSQ) — while α drifts to −0.005 (100.5% error)
  because the α-step operates on an α-blind residual. NLLSQ, initialized at
  the true α=1.0, drifts to 0.908 over 3000 epochs without plateau, and its
  solution R² *degrades* with training (0.44 → 0.31). The historical
  «NLLSQ recovers α ≈ 0.965» was an initialization artifact; the historical
  «VarPro fails (178%)» was an implementation artifact. Lesson recorded
  in-notebook: an identifiable benchmark needs a source independent of the
  unknown.
- **Double pendulum PINN (fixed and re-run 2026-10-07).** Two data-handling
  bugs from the audit were fixed — the initial-condition loss is now
  evaluated at t=0 (it used to land on a random shuffled batch point) and
  the energy-variation penalty is computed on time-sorted points — and a
  numerical comparison against the `solve_ivp` reference was added. Final
  training loss **0.00198** (epoch 199/200; the old 0.0244 was an
  epoch-100 intermediate of the buggy run). The new reference metrics tell
  the honest story: relative L2 error **0.86–0.97 per component** and
  energy drift ~36 J — the PINN drives its residuals down yet does **not**
  reproduce the chaotic reference trajectory. Low training loss ≠ correct
  solution; both facts are reported side by side.
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
- **Oregonator surrogate (broadcast bug fixed 2026-10-07).** The MSE was
  computed on an `[N,1]` vs `[N]` broadcast in both train and test; with
  matching shapes (`.squeeze(-1)`), the real numbers are **1.28e-6 train /
  1.48e-5 test** (seed 42, weights saved). The previously reported
  0.078/0.346 were the pessimistic `MSE + 2·Cov` broadcast bound — the
  model converges; it never plateaued at 0.078. The code still solves a
  temporal ODE (diffusion/advection coefficients defined and unused), now
  stated in-notebook.

<div class="chart-block"><script type="application/json" class="chart-data">
{"type":"bar","title":"Oregonator surrogate — real MSE after broadcast-shape fix (seed 42, 2026-10-07)","xLabel":"evaluation set","yLabel":"MSE (log scale)","logScale":true,"labels":["train","test (held-out tail)"],"datasets":[{"label":"MSE","data":[0.00000128,0.0000148]}],"values":true,"source":"neural-pdes-solver/RDA-DN-NA.ipynb FINAL_METRICS (post-fix re-run)"}
</script></div>
- **SIR / COVID (fixed 2026-10-07).** The original run did not converge —
  flat ELBO, β = γ = initialization. The fix traced the root cause to
  **I(0) = 0**: the CSV's first 38 days have zero infected, which freezes
  the Euler dynamics and kills every gradient (a scale-only hypothesis was
  insufficient — normalization alone kept the loss flat). Trimming to days
  with cases (from 2020-02-29) plus population-fraction normalization made
  SVI converge: **β = 0.193, γ = 0.119, R₀ ≈ 1.62**, ELBO down 62%
  (29,476 → 11,187 over 2000 iterations, monotone). Failure → diagnosed →
  fixed, all three states preserved in the notebook.

## Results

- A **domain-decomposed PINN** for the double pendulum with interface
  continuity and an energy-variation penalty, whose 2026-10-07 audit-driven
  fix cycle (IC at t=0, sorted energy penalty, numerical reference
  comparison) turned a misleadingly low loss into an honest verdict: final
  loss 0.00198 **with** relative L2 error 0.86–0.97 vs `solve_ivp` — the
  residuals fit, the chaotic trajectory is not reproduced.
- A **benchmark identifiability finding** for the inverse Poisson problem:
  the manufactured source makes α unrecoverable *by construction*, proven
  by a correct Golub–Pereyra VarPro that recovers the solution field to
  machine precision (R² 1.0, 3.2e-13) in 1/10 of NLLSQ's time while α
  stays unidentified — plus the correction of two historical overclaims
  («recovers 0.965» was an init artifact; «VarPro fails 178%» was an
  implementation artifact).
- A **fixed-from-failure SIR inference**: the COVID SVI now converges
  (β=0.193, γ=0.119, R₀≈1.62) after diagnosing I(0)=0 as the root cause.
- A **reproduction of the known NODE topology limitation** (homeomorphism
  constraint) and its resolution via augmentation, verified numerically on
  the canonical concentric-circles benchmark.

## Honest caveats

- **Everything here is demonstrated on synthetic or benchmark problems.** The
  Poisson problem uses a manufactured solution (one whose source term, as
  the 2026-10-07 analysis showed, makes α unidentifiable); the Oregonator
  data is generated by my own RK4; the NODE experiments are 2D toy datasets.
  The one real-data experiment (COVID SIR inference) initially failed and
  was fixed by diagnosing I(0)=0 — both states are reported.
- The double-pendulum PINN is a prime example of why training loss alone
  certifies nothing: 0.00198 loss coexists with ~0.9 relative L2 error
  against the reference on this chaotic system.
- The 2026-10-07 audit-and-fix cycle (VarPro re-implementation, shape fixes,
  IC-at-t=0) was driven by this portfolio's own verification standard; the
  pre-fix numbers remain in git history and the notebooks' prose for
  traceability.
- Results were produced on a single consumer GPU (RTX 5070 Ti Laptop, 12 GB);
  no seed sweeps, uncertainty quantification, or cross-run variance analysis
  were performed. Seed 42 is fixed where noted (RDA, SD-ODEs).
- The notebooks are research code: some Spanish commentary, and no packaging
  or tests. This is an exploratory sandbox, not a shipped library.
