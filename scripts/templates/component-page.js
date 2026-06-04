export function generateComponentPage(data, name) {
  // Extract class reference from sections that have no examples (list-based sections)
  const classRefSections = data.sections.filter(s =>
    ['Intents', 'Variants', 'Sizes'].includes(s.title) && s.examples.length === 0
  );
  // Keep track of which section indices we've used for class reference
  const classRefIndices = new Set();
  data.sections.forEach((s, idx) => {
    if (['Intents', 'Variants', 'Sizes'].includes(s.title) && s.examples.length === 0) {
      classRefIndices.add(idx);
    }
  });
  const otherSections = data.sections.filter((_, idx) => !classRefIndices.has(idx));

  const classRef = classRefSections.map(s => {
    // Extract list items from description
    const descItems = s.description.match(/- `\.\w+`/g) || [];
    const allItems = descItems.map(d => d.replace(/- `|`|/g, '').trim());
    return `<div class="class-group">
<h3>${s.title}</h3>
<div class="class-list">${allItems.map(item => `<code>${item}</code>`).join(' ')}</div>
</div>`;
  }).join('\n');

  // Remove accessibility section from otherSections if it exists
  const contentSections = otherSections.filter(s => s.title !== 'Accessibility');

  const sections = contentSections.map(s => {
    const examples = s.examples.map(ex => {
      return `<div class="example-render">${ex}</div>
<div class="example-code">
<pre><code>${escapeHtml(ex)}</code></pre>
</div>`;
    }).join('\n');
    return `<section class="component-section">
<h2>${escapeHtml(s.title)}</h2>
${s.description ? `<p>${escapeHtml(s.description)}</p>` : ''}
<div class="example-group">
${examples}
</div>
</section>`;
  }).join('\n');

  // Extract accessibility from the Accessibility section if present
  const accessibilitySection = data.sections.find(s => s.title === 'Accessibility');
  if (accessibilitySection) {
    // Split by " - " or "- " at the beginning of a line
    const raw = accessibilitySection.description;
    const accessibilityItems = raw.split(/\s*-\s+/).filter(s => s.trim()).map(s => s.trim());
    data.accessibility = accessibilityItems;
  }

  const accessibility = data.accessibility?.length ? `
<section class="component-section">
<h2>Accessibility</h2>
<ul>
${data.accessibility.map(a => `<li>${escapeHtml(a)}</li>`).join('\n')}
</ul>
</section>
` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(data.title)} — Actual CSS</title>
  <link rel="stylesheet" href="../../dist/actual.css">
  <link rel="stylesheet" href="../../demo/styles/demo.css">
</head>
<body>
  <nav class="demo-nav">
    <a href="../">← Components</a>
    <a href="../../demo/">Kitchensink</a>
  </nav>
  <main class="center">
    <header class="component-header">
      <h1>${escapeHtml(data.title)}</h1>
      <p>${escapeHtml(data.description)}</p>
    </header>
    ${classRef ? `<div class="class-reference">${classRef}</div>` : ''}
    ${sections}
    ${accessibility}
  </main>
  <footer class="demo-footer">
    <a href="../">Back to components</a>
  </footer>
</body>
</html>
`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
