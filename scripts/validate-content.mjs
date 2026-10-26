import fs from 'node:fs';
import path from 'node:path';

const filesUnder = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? filesUnder(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
);

let chartCount = 0;
let chartFailures = 0;
for (const file of filesUnder('src/content')) {
  if (!file.endsWith('.md')) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/<script type="application\/json" class="chart-data">([\s\S]*?)<\/script>/g)) {
    chartCount++;
    try {
      const chart = JSON.parse(match[1]);
      if (!chart.type || !chart.labels || !chart.datasets?.length) throw new Error('missing fields');
      for (const dataset of chart.datasets) {
        if (!Array.isArray(dataset.data) || dataset.data.length !== chart.labels.length) {
          throw new Error('data/labels length mismatch');
        }
        if (dataset.data.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
          throw new Error('non-finite value');
        }
      }
    } catch (error) {
      chartFailures++;
      console.error(`FAIL ${file}: ${error.message}`);
    }
  }
}
console.log(`charts validated: ${chartCount}, failures: ${chartFailures}`);

const pages = new Set();
for (const file of filesUnder('src/content')) {
  const base = path.basename(file, '.md');
  const directory = path.basename(path.dirname(file));
  if (directory === 'case-studies') pages.add(`/case-studies/${base}/`);
  if (directory === 'publications') pages.add(`/publications/${base}/`);
}

let brokenLinks = 0;
for (const file of filesUnder('src')) {
  if (!/\.(md|astro)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\]\((\/[a-z0-9\-/]*)\)/g)) {
    const linkedPath = match[1];
    if (linkedPath === '/' || /\.(png|pdf|svg|css|js)$/.test(linkedPath)) continue;
    if (!pages.has(linkedPath) && !fs.existsSync(`public${linkedPath}`)) {
      brokenLinks++;
      console.error(`BROKEN ${file} -> ${linkedPath}`);
    }
  }
}
console.log(`internal links checked, broken: ${brokenLinks}`);

if (chartFailures > 0 || brokenLinks > 0) process.exit(1);
