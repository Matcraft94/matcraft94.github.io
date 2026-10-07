/* Interactive charts for case studies.
 *
 * Convention: any
 *   <div class="chart-block"><script type="application/json" class="chart-data">{...}</script></div>
 * block inside markdown content is rendered as a Chart.js canvas.
 *
 * JSON schema (all values must come from verified repository outputs):
 *   {
 *     "type": "bar" | "line" | "scatter",
 *     "title": "string",
 *     "xLabel": "string", "yLabel": "string",
 *     "labels": [...],
 *     "datasets": [{"label": "...", "data": [...], "color": "#5eead4"}],
 *     "yLog": false,
 *     "hline": 0,            // optional horizontal reference line value
 *     "source": "notebooks/03_backtesting.ipynb"
 *   }
 */
(function () {
  const PAPER = '#e8eaf0';
  const MUTED = '#8892a8';
  const GRID = 'rgba(255, 255, 255, 0.06)';
  const ACCENT = '#5eead4';
  const ACCENT2 = '#7dd3fc';

  function baseOptions(cfg) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.9,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: MUTED, font: { family: 'ui-monospace, monospace', size: 11 }, boxWidth: 12 },
        },
        title: {
          display: !!cfg.title,
          text: cfg.title,
          color: PAPER,
          font: { family: 'ui-monospace, monospace', size: 13, weight: 'normal' },
          padding: { bottom: 12 },
        },
        tooltip: {
          backgroundColor: '#11141c',
          borderColor: GRID,
          borderWidth: 1,
          titleColor: PAPER,
          bodyColor: MUTED,
          titleFont: { family: 'ui-monospace, monospace' },
          bodyFont: { family: 'ui-monospace, monospace', size: 12 },
        },
      },
      scales: {
        x: {
          title: { display: !!cfg.xLabel, text: cfg.xLabel || '', color: MUTED, font: { family: 'ui-monospace, monospace', size: 11 } },
          ticks: { color: MUTED, font: { family: 'ui-monospace, monospace', size: 11 }, maxRotation: 0 },
          grid: { color: GRID },
        },
        y: {
          type: cfg.yLog ? 'logarithmic' : 'linear',
          title: { display: !!cfg.yLabel, text: cfg.yLabel || '', color: MUTED, font: { family: 'ui-monospace, monospace', size: 11 } },
          ticks: { color: MUTED, font: { family: 'ui-monospace, monospace', size: 11 } },
          grid: { color: GRID },
        },
      },
    };
  }

  function render(block) {
    const script = block.querySelector('script.chart-data');
    if (!script) return;
    let cfg;
    try {
      cfg = JSON.parse(script.textContent);
    } catch (e) {
      block.textContent = 'Chart config error: ' + e.message;
      return;
    }
    const canvas = document.createElement('canvas');
    block.appendChild(canvas);

    const palette = [ACCENT, ACCENT2, '#f0abfc', '#fda4af', '#fcd34d'];
    const datasets = (cfg.datasets || []).map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || palette[i % palette.length],
      backgroundColor: (ds.color || palette[i % palette.length]) + (cfg.type === 'line' ? '22' : 'cc'),
      borderWidth: cfg.type === 'line' ? 2 : 1,
      pointRadius: cfg.type === 'line' ? 0 : 3,
      tension: 0.25,
      fill: false,
    }));

    const options = baseOptions(cfg);
    if (cfg.hline !== undefined) {
      // reference line via a second dataset on a bar/line chart
      datasets.push({
        label: 'zero',
        data: cfg.labels.map(() => cfg.hline),
        borderColor: 'rgba(255,255,255,0.25)',
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [4, 4],
      });
    }

    new Chart(canvas, { type: cfg.type || 'bar', data: { labels: cfg.labels, datasets }, options });

    if (cfg.source) {
      const src = document.createElement('div');
      src.className = 'chart-source';
      src.textContent = 'source: ' + cfg.source;
      block.appendChild(src);
    }
  }

  function init() {
    if (typeof Chart === 'undefined') {
      document.querySelectorAll('.chart-block').forEach((b) => {
        b.textContent = 'Interactive chart requires JavaScript (Chart.js failed to load).';
      });
      return;
    }
    document.querySelectorAll('.chart-block').forEach(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
