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
      const directives = ex.directives || [];
      const code = ex.code;
      
      // Determine layout based on directives
      const isInline = directives.includes('inline') || directives.includes('row');
      const isList = directives.includes('list') || directives.includes('stack');
      const isGrid = directives.includes('grid');
      const isCenter = directives.includes('center');
      const isFull = directives.includes('full');
      const noCode = directives.includes('no-code');
      
      // Build CSS classes
      const renderClasses = ['example-render'];
      if (isInline) renderClasses.push('example-inline');
      if (isList) renderClasses.push('example-list');
      if (isGrid) renderClasses.push('example-grid');
      if (isCenter) renderClasses.push('example-center');
      if (isFull) renderClasses.push('example-full');
      
      // Pass through additional non-layout directive classes
      const layoutDirectives = ['inline', 'row', 'list', 'stack', 'grid', 'center', 'full', 'no-code'];
      const extraClasses = directives.filter(d => !layoutDirectives.includes(d));
      renderClasses.push(...extraClasses);
      
      // Determine layout based on directives or content
      const lines = code.trim().split('\n');
      const isSingleLine = lines.length === 1;
      const isMultiLine = lines.length > 1;
      
      // Block elements that should be treated as single items even in inline mode
      const blockElementStart = /^<(div|article|section|nav|fieldset|table|details|progress|meter|label|figure|dialog|article|aside|header|footer|main|form|ul|ol|dl|blockquote|pre|address|h[1-6])\b/i;
      
      // If no directive specified, guess based on content
      if (!isInline && !isList && !isGrid && !isCenter && !isFull) {
        const firstLine = lines[0].trim();
        // Block elements get list layout
        if (blockElementStart.test(firstLine)) {
          renderClasses.push('example-list');
        } else if (isMultiLine) {
          renderClasses.push('example-inline');
        }
      }
      
      // Build render content
      let renderContent;
      if (isMultiLine && (isList || renderClasses.includes('example-list'))) {
        // For list layout, render each line directly
        renderContent = lines.map(line => line.trim()).join('\n');
      } else if (isMultiLine && (isInline || renderClasses.includes('example-inline'))) {
        // For inline layout, group block elements as single items
        const items = [];
        let currentItem = [];
        let inBlockElement = false;
        let blockDepth = 0;
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          // Check if this line starts a block element
          const isBlockStart = blockElementStart.test(trimmed);
          
          if (isBlockStart && !inBlockElement) {
            // Starting a new block element
            if (currentItem.length > 0) {
              items.push(currentItem.join('\n'));
              currentItem = [];
            }
            inBlockElement = true;
            const openTags = (trimmed.match(/<\w+[^>]*?>/g) || []).length;
            const closeTags = (trimmed.match(/<\/\w+>/g) || []).length;
            blockDepth = openTags - closeTags;
            currentItem.push(trimmed);
            if (blockDepth <= 0) {
              items.push(currentItem.join('\n'));
              currentItem = [];
              inBlockElement = false;
            }
          } else if (inBlockElement) {
            // Count opening and closing tags to track depth
            const openTags = (trimmed.match(/<\w+[^>]*?>/g) || []).length;
            const closeTags = (trimmed.match(/<\/\w+>/g) || []).length;
            blockDepth += openTags - closeTags;
            currentItem.push(trimmed);
            if (blockDepth <= 0) {
              items.push(currentItem.join('\n'));
              currentItem = [];
              inBlockElement = false;
            }
          } else {
            // Inline element - each line is its own item
            if (currentItem.length > 0) {
              items.push(currentItem.join('\n'));
            }
            currentItem = [trimmed];
          }
        }
        
        if (currentItem.length > 0) {
          items.push(currentItem.join('\n'));
        }
        
        renderContent = items.map(item => `<div class="example-item">${item}</div>`).join('\n');
      } else {
        renderContent = code;
      }
      
      const renderHtml = `<div class="${renderClasses.join(' ')}">${renderContent}</div>`;
      const codeHtml = noCode ? '' : `<div class="example-code">
<pre><code>${escapeHtml(code)}</code></pre>
</div>`;
      
      return `${renderHtml}${codeHtml}`;
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
  <link rel="stylesheet" href="../../src/actual.css">
  <link rel="stylesheet" href="../../demo/styles/demo.css">
</head>
<body>
  <nav class="demo-nav">
    <a href="index.html">← Components</a>
    <a href="../../demo/index.html">Kitchensink</a>
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
    <a href="index.html">Back to components</a>
  </footer>
</body>
</html>
`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
