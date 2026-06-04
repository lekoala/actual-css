export function parseComponentMarkdown(md) {
  const lines = md.split('\n');
  const result = {
    title: '',
    description: '',
    sections: [],
    accessibility: [],
  };

  let i = 0;

  // Skip empty lines at start
  while (i < lines.length && lines[i].trim() === '') i++;

  // Title: # Title
  if (lines[i]?.startsWith('# ')) {
    result.title = lines[i].slice(2).trim();
    i++;
  }

  // Skip empty lines
  while (i < lines.length && lines[i].trim() === '') i++;

  // Description: first paragraph
  const descLines = [];
  while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')) {
    descLines.push(lines[i].trim());
    i++;
  }
  result.description = descLines.join(' ');

  // Skip to first section
  while (i < lines.length && lines[i].trim() === '') i++;

  // Parse sections
  let currentSection = null;

  while (i < lines.length) {
    const line = lines[i];

    // New section
    if (line.startsWith('## ')) {
      if (currentSection) {
        result.sections.push(currentSection);
      }
      currentSection = {
        title: line.slice(3).trim(),
        description: '',
        examples: [],
      };
      i++;
      // Skip empty lines
      while (i < lines.length && lines[i].trim() === '') i++;
      // Collect description lines until code block or next heading
      const sectionDescLines = [];
      while (i < lines.length && !lines[i].startsWith('```') && !lines[i].startsWith('#')) {
        if (lines[i].trim() !== '') {
          sectionDescLines.push(lines[i].trim());
        }
        i++;
      }
      currentSection.description = sectionDescLines.join(' ');
      continue;
    }

    // Code block
    if (line.startsWith('```html')) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (currentSection) {
        currentSection.examples.push(codeLines.join('\n'));
      }
      i++; // skip closing ```
      continue;
    }

    // Accessibility list (usually after all sections, outside section)
    if (line.startsWith('- ') && !currentSection && result.sections.length > 0) {
      result.accessibility.push(line.slice(2).trim());
      i++;
      continue;
    }

    i++;
  }

  if (currentSection) {
    result.sections.push(currentSection);
  }

  return result;
}
