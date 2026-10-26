---
title: "CEIE Production Data Ecosystem"
subtitle: "Connected pipelines for assessment, psychometrics, business intelligence, and reporting"
description: "A production ecosystem built and maintained for CEIE at Universidad UTE, connecting data capture, ETL, psychometric modeling, semantic BI models, and individualized reporting. The case focuses on the system boundaries, quality controls, and operational results rather than exposing institutional code or data."
category: "data-systems"
tags: ["data-engineering", "psychometrics", "power-bi", "etl", "production-systems"]
pubDate: 2026-10-25
featured: false
status: "published"
projectStatus: "production"
codeAvailability: "private"
metrics:
  - label: "Production ecosystem"
    value: "~20"
    note: "repositories covering the assessment lifecycle"
  - label: "Semantic BI models"
    value: "8"
    note: "versionable PBIP and TMDL projects"
  - label: "Student surveys"
    value: "15,000+"
    note: "syllabus-tracking population"
  - label: "Regression controls"
    value: "94"
    note: "golden tests with exact counts"
stack: ["Python", "R", "FastAPI", "PostgreSQL", "Parquet", "Power BI", "Docker", "Microsoft Graph API"]
---

## Overview

At CEIE — the Center for Evaluation and Educational Innovation at Universidad
UTE — I am responsible for the quantitative analytics that support the center's
institutional decisions.

The work is not a collection of unrelated dashboards and scripts. It is an
ecosystem that carries information from operational sources through validated
transformations, statistical models, business intelligence, and individualized
reports.

## Problem

Assessment data arrives through Moodle, Banner, SICAF, KOBO, Microsoft Forms,
and SharePoint. The sources use different identifiers, formats, and update
cycles. A silent join error can change an institutional indicator; an isolated
statistical script can make a result impossible to reproduce.

The engineering problem was to create explicit boundaries between systems while
keeping statistical definitions consistent and failures visible.

## What I built

**A shared data layer.** Medallion pipelines produce versioned Parquet tables in
star schemas. The comprehensive-exam pipeline, for example, publishes 21 gold
tables: 13 facts and 8 dimensions.

**Psychometric analysis in the pipeline.** R and Python components support CTT,
IRT, anchor-item equating, Bayesian IRT, confirmatory factor analysis, causal
inference, and survival analysis. Method choices and priors are documented
rather than left as implicit defaults.

**A versionable BI layer.** Eight Power BI semantic models use PBIP and TMDL so
model definitions can live in source control. Psychometric measures implemented
in DAX remain available across institutional filters and dimensions.

**Operational delivery.** FastAPI and Vue applications, asynchronous workers,
and reporting tools support assessment operations. The mass-reporting pipeline
generates individualized PDFs and tracks delivery by recipient.

**Local AI where it fits.** Institutional AI experiments use local inference,
retrieval, and structured logs. The curriculum-mapping case study describes one
of these pipelines in detail.

## Evidence and operating controls

- Approximately **20 production repositories** cover capture, ETL, analysis, BI,
  and reporting for CEIE.
- The data platform supports syllabus-tracking surveys for **15,000+ students**,
  evaluation workflows for approximately **1,300 faculty per term**, and 23
  degree programs across five assessment cycles.
- The comprehensive-exam migration retained **94 exact-count golden tests**.
- The instructor-evaluation pipeline runs approximately **42 automated audit
  checks** per execution and documents genuine gaps instead of silently filling
  them.
- The reporting system generated **1,000 individualized PDFs in about 13 minutes**
  in the documented run, with **99% successful generation** and per-recipient
  delivery tracking.

## Decisions that mattered

**One canonical owner per calculation.** A downstream repository consumes a
canonical result instead of reimplementing the same statistical definition.

**Contracts between repositories.** Parquet schemas and documented dependencies
make producer and consumer responsibilities explicit.

**Reconciliation during migration.** Golden tests and comparisons against prior
outputs protect behavior when a monolith becomes a modular pipeline.

**Quality reports over silent success.** Missing data, unmatched identities, and
coverage gaps are surfaced as operational outputs.

## Limitations and availability

This is a sanitized case study. Institutional repositories, personal data,
internal dashboards, credentials, and generated student or faculty reports are
private.

The figures describe CEIE's systems and documented runs, not the entire
university. Because the underlying institutional data is private, this page
explains architecture and controls without publishing a reproducible public
dataset.
