export function generateComponentsIndex(components) {
  const customPreviews = {
    dialog: `<div class="card" style="padding:1.5rem;max-width:16rem;"><h3 style="margin:0 0 0.5rem;font-size:1rem;">Confirm</h3><p style="margin:0 0 1rem;font-size:0.875rem;color:var(--text-muted);">Are you sure?</p><div class="cluster" style="justify-content:flex-end;"><button class="btn neutral outline sm">Cancel</button><button class="btn danger sm">Delete</button></div></div>`
  };

  const cards = components.map(c => {
    let preview = customPreviews[c.name] || '';
    if (!preview) {
      const firstSection = c.sections?.find(s => s.examples?.length > 0);
      const firstExample = firstSection?.examples[0];
      if (firstExample) {
        if (typeof firstExample === 'string') {
          preview = firstExample;
        } else if (firstExample.code) {
          preview = firstExample.code;
        }
      }
    }
    return `<article class="component-card">
      <div class="card-preview">
        ${preview}
      </div>
      <div class="card-info">
        <h3><a href="${c.name}.html">${c.title}</a></h3>
        <p>${c.description}</p>
      </div>
    </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Components — Actual CSS</title>
  <link rel="stylesheet" href="../../src/actual.css">
  <link rel="stylesheet" href="../../demo/styles/demo.css">
</head>
<body>
  <nav class="demo-nav">
    <a href="../../demo/index.html">← Kitchensink</a>
  </nav>
  <main class="center">
    <header>
      <h1>Components</h1>
      <p>${components.length} components with intents, variants, and sizes.</p>
    </header>
    <div class="components-grid">
      ${cards}
    </div>
  </main>
</body>
</html>
`;
}
