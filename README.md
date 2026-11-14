# vennerstrom.se

Hugo site. Native CSS and JS, Lenis as the only dependency, no npm.

## Run

```bash
hugo server --buildDrafts
```

Open http://localhost:1313. `--buildDrafts` includes the test content (the "Alla block" case and the test blog posts). Leave it off to see the real site.

Build for publishing:

```bash
hugo --minify --cleanDestinationDir
```

Output goes to `public/`.

Readable copies of the bundled CSS and JS (not minified, for reading or auditing): run `./export-readable.sh` in the project root. It builds with `--environment readable` and writes `bundle.css`, `main.js` and `smooth.js` to `readable/` next to `site/`. The CSS keeps its comments; esbuild strips JS comments, so the commented JS is in `assets/js/`.

## Where things are

| Path | What |
|---|---|
| `content/_index.md` | All home page copy (front matter): intro, about, messages, background, contact |
| `content/work/<name>/` | One case per folder: `index.md` + its images. The folder name is the URL |
| `content/blog/` | Blog posts: a file, or a folder when the post has images |
| `hugo.toml` | Site settings, section nav (`menus.main`), how many cards show before "Visa fler" |
| `assets/css`, `assets/js` | The prototype's CSS and JS, bundled by `layouts/_partials/head.html` |
| `layouts/home.posts.json` | `/posts.json` for "Visa fler", generated from the content |

## New content

```bash
hugo new content work/case-name/index.md
```

```bash
hugo new content blog/post-name.md
```

Both start as drafts. Remove `draft: true` to publish.

## Writing a case

Plain Markdown, plus a few blocks. A lone image becomes a figure; attributes on the line below it set the size:

```markdown
![Alt text](image.webp "Optional caption")
{.large loading="eager"}
```

`.large` spans the full width. Use `loading="eager"` only for the first image. Every image and video keeps its own shape automatically: images from the file, Vimeo videos from Vimeo (fetched at build time). Media taller than the screen shrinks instead of being cropped, and items in a `grid` row line up at the same height. Add `ratio="16 / 9"` only to force a different shape (cropped to fit). Add `parallax=true` for the scroll parallax (the image drifts inside its frame; off with reduced motion), e.g. `{.large parallax=true}`.

| Block | Use |
|---|---|
| `{{< lead >}}…{{< /lead >}}` | Larger text between images |
| `{{< text title="…" cols="2" >}}…{{< /text >}}` | Text, optionally in 2 or 3 columns |
| `{{< grid >}}…{{< /grid >}}` | Images side by side, one per paragraph |
| `{{< quote cite="…" >}}…{{< /quote >}}` | Large quote |
| `{{< vimeo id="…" class="large" >}}` | Vimeo background video (muted loop), in the video's own shape |

`vimeo` also works inside `{{< grid >}}`. All video is on Vimeo; the site hosts no video files.

`content/work/alla-block/` uses every block.

## SEO and publishing

- `layouts/_partials/seo.html`: title, description, canonical, robots, Open Graph, Twitter card and JSON-LD (Person on the home page, CreativeWork on cases, BlogPosting on posts). A page's `description` falls back to the site description.
- Share image (`og:image`, 1200 × 630 JPG): a case's banner; for other pages the portrait (`shareImage` in `hugo.toml`), shown whole on white.
- The home page's Person data: `[params.person]` in `hugo.toml`, plus links, e-mail and portrait from `content/_index.md`.
- To keep a page out of search engines, add `sitemap: { disable: true }` to its front matter. It then gets `noindex` and drops out of `sitemap.xml`.
- `layouts/robots.txt`: the live site's rules (search and AI-search allowed, AI training crawlers blocked).
- `layouts/404.html`: a real 404 page (GitHub Pages serves it for missing URLs).
- `static/CNAME`: the custom domain for GitHub Pages.
- Links to site-root paths go through `layouts/_partials/link.html`, so the site also works under a sub-path.

## Preview

The `main` branch of vv-portf-theme is the preview until the site goes live. Every push builds it with `.github/workflows/preview.yml` and publishes it on the repo's GitHub Pages (shortvalleyhillhiker.github.io/vv-portf-theme/). The live site is untouched.

- `hugo --environment preview` blocks every crawler in `robots.txt` and puts `noindex` on every page.
- Drafts are left out, as in a real release. Hugo 0.169 or later (the version is set in the workflow).

## Warming a case on hover

Every link to a case (home cards, "Visa fler" cards, next case) carries `data-preload`: the case's first media items (`preloadMedia` in `hugo.toml`, default 3), read from its rendered content by `layouts/_partials/preload.html`. After 100 ms of hover, or on focus or first touch, `main.js` loads those images in the same size the page will pick, and loads the Vimeo player once, hidden and paused, so its scripts are cached. Skipped with Save-Data on. Measured: the Vimeo player is ready in about 310 ms instead of about 560 ms, and the first image comes from cache.

## Images

Put the original in the case folder. Hugo makes 640, 960, 1280, 1920 and 2560px WebP versions (never larger than the original) and writes `srcset`, `width` and `height`. Only these sizes are published, not the originals.

Which file a browser fetches depends on the image's `sizes`, written by `layouts/_partials/sizes.html` from the page grid: full width, a share of a grid row, home cards (including the parallax zoom), the portrait, and never taller than the screen. Lazy images also get `sizes="auto"`, so browsers that support it use the measured width. Change the grid or the breakpoints in the CSS, and that partial needs the same change.

## Open items

- A real share image (`shareImage` in `hugo.toml`): it's the portrait for now.
- Scrollbars are hidden site-wide (`10-reset.css`). Worth another look now that Lenis is in.
