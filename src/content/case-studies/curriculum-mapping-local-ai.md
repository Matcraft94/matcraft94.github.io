---
title: "Curriculum Mapping with Local AI"
subtitle: "Prerequisite graphs and curriculum-review artifacts for 23 degree programs"
description: "A local-AI pipeline that identifies prerequisite relationships between university courses, builds validated curriculum graphs, and prepares evidence for expert review. It combines document processing, BGE-M3 embeddings, an LLM judge, graph algorithms, and an offline Wikipedia knowledge source without sending institutional documents to external AI APIs."
category: "applied-ai"
tags: ["local-llms", "information-retrieval", "embeddings", "graphs", "human-in-the-loop"]
pubDate: 2026-10-25
featured: true
featuredOrder: 1
status: "published"
projectStatus: "research-in-progress"
codeAvailability: "private"
metrics:
  - label: "Degree programs processed"
    value: "23"
    note: "graphs, spreadsheets, figures, and committee-review reports"
  - label: "Offline knowledge source"
    value: "6.09M"
    note: "Spanish Wikipedia articles indexed in Parquet"
  - label: "Course coverage"
    value: "98.6%"
    note: "Medicine pilot: 70 of 71 courses"
stack: ["Python", "BGE-M3", "Qwen3-14B", "llama.cpp", "NetworkX", "PyTorch Geometric", "scikit-learn", "Plotly"]
---

## Overview

Curriculum review requires more than comparing course titles. Experts need to
understand which courses prepare students for later work, where content is
repeated, and where important prerequisites are missing.

This project turns institutional syllabi into curriculum maps and review
materials for academic committees. It uses local models throughout: institutional
documents are not sent to an external AI service.

## Problem

The source material spans 23 degree programs and two large Excel data sources,
with inconsistent encodings, course identifiers, and levels of detail. A simple
text-similarity pipeline would produce plausible-looking but unreliable maps:
similar courses are not necessarily prerequisites, and an LLM response is not
evidence by itself.

The system therefore had to answer three separate questions:

- Which course pairs are worth reviewing?
- What kind of curricular relationship, if any, connects them?
- Can the resulting graph be checked and presented for expert validation?

## What I built

The pipeline has five stages:

1. **Document preparation.** Clean and join the syllabus sources, recover from
   encoding and identifier problems, and split each course into weighted
   curricular components.
2. **Candidate retrieval.** Embed those components with BGE-M3 and rank course
   pairs using cosine similarity and level-aware candidate selection.
3. **Local LLM review.** Ask a locally served Qwen model for structured
   relationship judgments, with versioned prompts, program-specific examples,
   retries, and per-call logs.
4. **Graph construction and analysis.** Build a directed graph, check coverage
   and connectivity, detect and correct cycles, and identify possible gaps,
   repetitions, and bridge courses.
5. **Expert-review artifacts.** Export graphs, confidence-colored spreadsheets,
   figures, and reports with explicit choices to accept, adjust, or reject a
   proposed relationship.

An offline index of 6,090,985 Spanish Wikipedia articles supplies an additional
entity-linking and evidence-enrichment step. A variational graph autoencoder is
also explored as a source of candidate links, not as an automatic source of truth.

<figure class="flow-diagram" aria-labelledby="curriculum-flow-caption">
  <ol class="flow-steps" role="list">
    <li>
      <span class="flow-step-number">01</span>
      <strong>Source documents</strong>
      <p>Clean and join course content from the institutional syllabi.</p>
    </li>
    <li>
      <span class="flow-step-number">02</span>
      <strong>Candidate retrieval</strong>
      <p>Rank course pairs using embeddings and curricular levels.</p>
    </li>
    <li>
      <span class="flow-step-number">03</span>
      <strong>Local model review</strong>
      <p>Produce structured relationship judgments with a local LLM.</p>
    </li>
    <li>
      <span class="flow-step-number">04</span>
      <strong>Graph validation</strong>
      <p>Check coverage, connectivity, cycles, and possible gaps.</p>
    </li>
    <li>
      <span class="flow-step-number">05</span>
      <strong>Expert review</strong>
      <p>Present evidence for experts to accept, adjust, or reject.</p>
    </li>
  </ol>
  <figcaption id="curriculum-flow-caption">Documents and model calls stay local. The pipeline proposes relationships; curriculum experts make the final decisions.</figcaption>
</figure>

## Evidence

For the Medicine reference program, the documented run produced:

- **71 courses and 408 relationships**: 151 prerequisites and 257 complementary
  links.
- **A valid directed acyclic graph**, with 70 of 71 courses covered.
- **436 of 436 structured LLM responses parsed on the first attempt** in the
  reported run.
- **86.7% pair-level agreement** (39 of 45 pairs) in the Qwen3-14B versus
  Qwen2.5-14B comparison used to select the default model.

Across the full artifact set, the pipeline generated graph exports for 23
programs, along with spreadsheets, figures, and review reports. These volume
metrics describe processed coverage; they are not a claim that every proposed
relationship has already been accepted by a committee.

## Decisions that mattered

**Retrieval before generation.** The LLM receives selected candidates instead of
being asked to invent an entire curriculum graph from scratch.

**Course components instead of one document vector.** Identity, descriptions,
objectives, topics, and minimum content carry different weights, reducing the
risk that generic course text dominates the match.

**Human review is part of the output.** The deliverable is evidence for a
curriculum committee, not an autonomous curriculum rewrite.

**Traceability over fluent output.** Prompt versions, input and output hashes,
latency, raw responses, retries, and parse outcomes are recorded so failures can
be inspected rather than hidden.

## Limitations and current status

This is a sanitized case study. The institutional source documents, generated
reports, and implementation are private.

The published metrics come from the documented Medicine pilot and the current
artifact inventory. They do not establish pedagogical validity across all 23
programs; expert review remains necessary. Model agreement measures consistency
between models, not correctness. The project remains applied research with
human validation built into its intended use.
