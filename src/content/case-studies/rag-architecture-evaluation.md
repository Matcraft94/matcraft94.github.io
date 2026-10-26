---
title: "Evaluating RAG Architectures on an Institutional Corpus"
subtitle: "A controlled comparison before choosing a production retrieval design"
description: "An empirical evaluation environment for six retrieval-augmented generation architectures on a real institutional corpus. The project combines a gold question-answer set, local models, vector and lexical retrieval, and phased quality gates to compare designs before committing to a production architecture."
category: "applied-ai"
tags: ["rag", "hybrid-search", "reranking", "llamaindex", "qdrant", "pgvector"]
pubDate: 2026-10-25
featured: false
status: "published"
projectStatus: "experiment"
codeAvailability: "private"
metrics:
  - label: "Architectures compared"
    value: "6"
    note: "from naive RAG to hybrid and long-context designs"
  - label: "Evaluation corpus"
    value: "28"
    note: "institutional SharePoint documents"
  - label: "Reference set"
    value: "40"
    note: "gold question-answer pairs"
stack: ["LlamaIndex", "Qdrant", "PostgreSQL/pgvector", "BGE-M3", "llama.cpp", "Docker", "pytest"]
---

## Overview

Retrieval-augmented generation is often presented as a single feature: add a
vector database and answer questions over private documents. In practice, the
retrieval design changes what the model sees, which sources it can cite, and
where the system fails.

This project creates an evaluation environment for comparing those designs on
an institutional corpus before choosing one for production.

## Problem

A document-management system must handle different document formats, preserve
access boundaries, and retrieve useful evidence for real institutional
questions. A small demonstration can look convincing even when chunking,
ranking, or source coverage is inadequate.

The evaluation had to make architecture choices comparable and keep all source
documents inside a local environment.

## What I built

The experimental environment compares six approaches:

1. Naive vector RAG.
2. Hybrid BM25 and vector retrieval.
3. Late chunking.
4. Re-ranking.
5. Multi-modal retrieval.
6. Long-context processing.

LlamaIndex provides the orchestration layer, Qdrant and PostgreSQL/pgvector
provide retrieval backends, and BGE-M3 provides embeddings. Local LLM serving
keeps inference on institutional hardware.

The project separates model, retrieval, embedding, and evaluation configuration
so an experiment changes one architectural choice at a time. A phased plan and
automated checks prevent later phases from silently using an incomplete setup.

## Evaluation design

The reference corpus contains **28 SharePoint documents** and **40 gold
question-answer pairs**. These pairs provide a fixed basis for comparing what
each architecture retrieves and answers instead of selecting examples after
seeing the output.

The supporting local-model benchmark recorded generation rates of **21–34
tokens per second** across the documented model catalog and hardware. That is an
operational measurement, not a measure of retrieval quality.

## Limitations and current status

The documented evidence establishes the corpus, evaluation design, and six
architectures under comparison. It does not support a public claim that one
architecture won or that the system is deployed in production.

The institutional corpus, evaluation answers, and implementation are private.
This sanitized case therefore focuses on the evaluation methodology and does not
publish confidential documents or unverified comparative scores.
