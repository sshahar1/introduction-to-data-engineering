[![Netlify Status](https://api.netlify.com/api/v1/badges/c479f9f0-be13-4386-8f22-759544713212/deploy-status)](https://app.netlify.com/sites/hardcore-galileo-55838f/deploys)

# Introduction to Data Engineering

A slide deck built with [Astro](https://astro.build) and deployed to Netlify.

## Usage

Edit and extend the slides in the [src/slides/](src/slides/) directory.
Navigate with the arrow keys (Enter and Space also go forward) or by swiping.

```bash
# To develop & write (http://localhost:8000)
$ yarn develop

# To build (output in dist/)
$ yarn build

# To preview the production build locally
$ yarn serve
```

## Writing

Markdown files in `src/slides/` are loaded in sorted path order, so the file
name (`NN-topic.md`) sets the slide's position.

A file can hold several slides: separate them with a `---` line that has a
blank line before it. A `---` directly under a line of text is a Markdown
heading underline, not a slide break.

Put images in [src/resources/](src/resources/) and reference them with a
relative path; they are optimised at build time.

Examples:

```md
# This is the first slide

---

## This is the second slide

![Logo](../resources/logo.png)
```

## Presenting without network

The deck doesn't cache itself in the browser. If the venue network is
unreliable, run it from your laptop:

1. While online: `yarn install && yarn build`
2. At the venue: `yarn serve`, then open http://localhost:8000/1
