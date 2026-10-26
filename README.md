# eduardoarias.dev — Personal Portfolio

Personal site of Eduardo Arias (Mathematical Engineer & Data Scientist), targeting international positions.

Built with [Astro](https://astro.build) + Tailwind CSS v4. Content lives in `src/content/` as Markdown with typed frontmatter (content collections).

## Structure

```
src/
├── components/
│   └── CaseStudyCard.astro # shared project cards
├── content/
│   ├── case-studies/     # one file per case study (problem → method → evidence → result)
│   └── publications/     # publication entries
├── layouts/Base.astro    # shared layout: nav, footer, theme
└── pages/
    ├── index.astro       # landing: positioning, featured work, publications
    ├── about.astro
    ├── research.astro    # mathematical and scientific research
    ├── case-studies/     # listing + [slug] detail
    └── publications/     # listing + [slug] detail
```

## Content workflow

Case studies have a `status` field: `draft` entries are excluded from the build
(they exist in the repo but are never published). Set `status: "published"` when
a study is complete. Featured studies (`featured: true`) appear on the landing page.

## Commands

```bash
npm run dev        # local dev server
npm run build      # static build to dist/
npm run preview    # preview the built site
npm run validate   # content checks + build + built-site validation
```

Python tooling (notebook rendering for future case studies) is declared in
`pyproject.toml` — use `uv sync` instead of requirements.txt.

## Deployment

The site is published at `https://matcraft94.github.io` with GitHub Pages.
Because this is the `Matcraft94/matcraft94.github.io` user-site repository, no
additional Astro `base` path is required.

- `.github/workflows/ci.yml` validates content, builds the site, and checks every
  generated page, required route, asset, and internal reference on pull requests
  and pushes to `master`.
- `.github/workflows/deploy.yml` runs the same checks and deploys successful
  pushes to `master` using the official Astro and GitHub Pages actions. It also
  supports manual dispatch.

In the repository's GitHub Pages settings, select **GitHub Actions** as the
source. Run `npm run validate` locally before publishing changes.
