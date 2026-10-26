import fs from 'node:fs';
import path from 'node:path';

const filesUnder = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? filesUnder(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
);

if (!fs.existsSync('dist')) {
  throw new Error('dist/ does not exist. Run npm run build before validating the built site.');
}

const requiredRoutes = [
  '/',
  '/about/',
  '/research/',
  '/case-studies/',
  '/case-studies/academic-performance/',
  '/case-studies/actuarial-loss/',
  '/case-studies/aurora-glm/',
  '/case-studies/ceie-production-ecosystem/',
  '/case-studies/curriculum-mapping-local-ai/',
  '/case-studies/hawkes-order-flow/',
  '/case-studies/market-risk/',
  '/case-studies/ml-graph-partitioning/',
  '/case-studies/neural-pdes/',
  '/case-studies/rag-architecture-evaluation/',
  '/case-studies/tda-psych/',
  '/publications/',
  '/publications/biharmonic-ejde-2024/',
];
const requiredAssets = [
  '/cv-eduardo-arias-en.pdf',
  '/cv-eduardo-arias-es.pdf',
  '/favicon.svg',
  '/og-image.png',
  '/js/charts.js',
  '/js/vendor/chart.umd.min.js',
];
const routeFile = (route) => path.join('dist', ...route.split('/').filter(Boolean), 'index.html');
const isFile = (file) => fs.existsSync(file) && fs.statSync(file).isFile();
const resolveTarget = (pathname) => {
  if (pathname.endsWith('/')) return isFile(routeFile(pathname)) ? routeFile(pathname) : null;
  const direct = path.join('dist', ...pathname.split('/').filter(Boolean));
  if (isFile(direct)) return direct;
  const index = path.join(direct, 'index.html');
  return isFile(index) ? index : null;
};
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const failures = [];

for (const route of requiredRoutes) {
  if (!isFile(routeFile(route))) failures.push(`missing route ${route}`);
}
for (const asset of requiredAssets) {
  if (!isFile(path.join('dist', asset))) failures.push(`missing asset ${asset}`);
}

const htmlFiles = filesUnder('dist').filter((file) => file.endsWith('.html'));
let internalReferences = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<html\s+lang="en"/.test(html)) failures.push(`${file}: missing html lang="en"`);
  if (!/<title>.+<\/title>/.test(html)) failures.push(`${file}: missing title`);
  if (!/<main\s+id="main-content"/.test(html)) failures.push(`${file}: missing main landmark`);

  const relativeFile = path.relative('dist', file).split(path.sep).join('/');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
    const url = new URL(reference, `https://portfolio.local/${relativeFile}`);
    if (url.origin !== 'https://portfolio.local') continue;
    internalReferences++;
    const pathname = decodeURIComponent(url.pathname);
    const target = resolveTarget(pathname);
    if (!target) {
      failures.push(`${file}: broken internal reference ${reference}`);
      continue;
    }
    if (url.hash.length > 1) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      const targetHtml = fs.readFileSync(target, 'utf8');
      if (!new RegExp(`\\bid="${escapeRegExp(fragment)}"`).test(targetHtml)) {
        failures.push(`${file}: missing fragment ${reference}`);
      }
    }
  }
}

const home = isFile(routeFile('/')) ? fs.readFileSync(routeFile('/'), 'utf8') : '';
const featuredTitles = [
  'Curriculum Mapping with Local AI',
  'ML-Assisted Graph Partitioning',
  'Aurora-GLM',
];
const positions = featuredTitles.map((title) => home.indexOf(title));
if (positions.some((position) => position < 0)) {
  failures.push('homepage: one or more featured case studies are missing');
} else if (!positions.every((position, index) => index === 0 || position > positions[index - 1])) {
  failures.push('homepage: featured case studies are out of order');
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  throw new Error(`Built-site validation failed with ${failures.length} error(s).`);
}

console.log(`build validated: ${htmlFiles.length} pages, ${requiredAssets.length} required assets, ${internalReferences} internal references`);
console.log('required routes and featured order verified');
