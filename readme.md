# vv-portf

Hugo source for personal portfolio site.

## Repo Structure

This project uses two repositories:

- **vv-portf-theme** — Hugo source files (content, templates, config). This is the repo you work in.
- **vv-portf-static** — Generated static output. Linked as a Git submodule at the `public` folder.

## Setup

Dependencies:
- [Hugo Extended](https://gohugo.io/)
- [Node.js](https://nodejs.org/) (via nvm-windows)
- Git

Clone with submodules and install dependencies:
```
git clone --recurse-submodules https://github.com/ShortValleyHillhiker/vv-portf-theme
npm install
```

## Local Development

Start the dev server:
```
hugo server --buildDrafts
```

## Publishing

Build the static site:
```
npm run build
```

This runs Hugo with `cleanDestinationDir` enabled, ensuring the static output only contains pages that currently exist in content. The build script also preserves `public/.git`, which Hugo would otherwise delete.

Commit and push the static output:
```
cd public
git add .
git commit -m "build"
git push
cd ..
```

Then update the submodule reference in the source repo:
```
git add public
git commit -m "update static output"
git push
```