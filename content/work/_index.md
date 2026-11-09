---
# No /work/ page: the listing lives on the home page. The pages are still listed.
build:
  render: never
  list: always
# Bundle images are published only in the sizes the templates make, never as originals
cascade:
  build:
    publishResources: false
---
