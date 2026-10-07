# eduardoarias.dev — Personal Portfolio

Personal site of Eduardo Arias (Mathematical Engineer & Data Scientist), targeting international positions.

Built with [Astro](https://astro.build) + Tailwind CSS v4. Content lives in `src/content/` as Markdown with typed frontmatter (content collections).

## Structure

```
src/
├── content/
│   ├── case-studies/     # one file per case study (problem → method → evidence → result)
│   ├── publications/     # publication entries
│   └── blog/             # (reserved)
├── layouts/Base.astro    # shared layout: nav, footer, theme
└── pages/
    ├── index.astro       # landing: positioning, featured work, publications
    ├── about.astro
    ├── case-studies/     # listing + [slug] detail
    └── publications/     # listing + [slug] detail
```

## Content workflow

Case studies have a `status` field: `draft` entries are excluded from the build
(they exist in the repo but are never published). Set `status: "published"` when
a study is complete. Featured studies (`featured: true`) appear on the landing page.

## Commands

```bash
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # preview the built site
```

Python tooling (notebook rendering for future case studies) is declared in
`pyproject.toml` — use `uv sync` instead of requirements.txt.

## Deployment (pending decision)

The `site` in `astro.config.mjs` is a placeholder (`matcraft94.github.io`).
When a custom domain is chosen, update `site` there and in the eventual
GitHub Actions workflow. Do not deploy until branding/domain is decided.
