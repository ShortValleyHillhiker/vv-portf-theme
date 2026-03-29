# Project Context

Custom Hugo theme for a personal portfolio site. The developer is a front end art director — prioritize clean, minimal markup and CSS. Avoid over-engineering.

## Site Structure

- **Front page** — portfolio landing
- **Work** — case studies
- **Blog** — written posts

## Theme Goals

- Custom theme built from scratch, minimal styling for now
- Flat URL structure (e.g. no `/work/project-name`, `/blog/post-name`) output directly as /project-name or /post-name.
- Dynamic SEO (meta titles, descriptions, OG tags driven by content front matter) SwupJS page transitions
- Clean, semantic HTML
- No archive/list pages. The only content available is the front page and the content pages themselves.
- Keep post types separate on frontpage.
- Frontpage should dynamically load in posts if there are more than 6 available.

## Stack

- Hugo Extended
- Node / npm (for JS dependencies)
- SwupJS for transitions
- Minimal CSS — no frameworks

## Conventions

- Keep templates simple and readable
- No unnecessary abstractions
- CSS should be flat and easy to override later
- JS should be minimal and unobtrusive

## Repo Structure

- This repo (`vv-portf-theme`) contains all Hugo source files
- `public/` is a Git submodule pointing to `vv-portf-static`
- Build with `hugo`, commit `public/` separately to publish