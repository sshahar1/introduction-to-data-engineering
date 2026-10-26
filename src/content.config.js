import { defineCollection } from 'astro:content';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SLIDES_DIR = 'src/slides';
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const THEMATIC_BREAK = /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^ {0,3}(```|~~~)/;

// Split a Markdown body into slides at thematic breaks. A break counts only
// after a blank line (so a setext `---` heading never splits) and outside
// fenced code. Empty chunks are kept so numbering matches the old split('<hr>').
function splitSlides(body) {
  const chunks = [[]];
  let inFence = false;
  let previous = '';
  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line)) inFence = !inFence;
    const atBoundary = previous.trim() === '' || chunks.at(-1).length === 0;
    if (!inFence && atBoundary && THEMATIC_BREAK.test(line)) {
      chunks.push([]);
    } else {
      chunks.at(-1).push(line);
    }
    previous = line;
  }
  return chunks.map((lines) => lines.join('\n'));
}

function slideLoader() {
  return {
    name: 'slide-loader',
    async load({ config, store, renderMarkdown, watcher, logger }) {
      const root = fileURLToPath(config.root);
      const dir = path.join(root, SLIDES_DIR);

      const loadAll = async () => {
        const files = (await readdir(dir))
          .filter((name) => name.endsWith('.md'))
          .map((name) => path.join(dir, name))
          .sort();

        store.clear();
        let index = 0;
        for (const file of files) {
          const source = await readFile(file, 'utf8');
          const frontmatter = source.match(FRONTMATTER)?.[0] ?? '';
          const chunks = splitSlides(source.slice(frontmatter.length));
          const fileURL = pathToFileURL(file);
          const filePath = path.relative(root, file).split(path.sep).join('/');
          let title;
          for (const [i, chunk] of chunks.entries()) {
            // Frontmatter goes with the first chunk so its title is parsed.
            const markdown = i === 0 ? frontmatter + chunk : chunk;
            const rendered = await renderMarkdown(markdown, { fileURL });
            title ??= rendered.metadata?.frontmatter?.title;
            index += 1;
            store.set({
              id: String(index),
              data: { index, title, source: filePath },
              rendered,
              // Lets Astro resolve and optimise images referenced by the slide
              filePath,
              assetImports: rendered.metadata?.imagePaths,
            });
          }
        }

        if (index === 0) throw new Error(`no slides found in ${SLIDES_DIR}`);
        logger.info(`Loaded ${index} slides from ${files.length} files`);
      };

      await loadAll();

      // Dev server: reload the deck when slide files change.
      watcher?.add(dir);
      watcher?.on('all', (_event, changed) => {
        if (changed.startsWith(dir) && changed.endsWith('.md')) loadAll();
      });
    },
  };
}

export const collections = {
  slides: defineCollection({ loader: slideLoader() }),
};
