// Renders AI-generated text safely - the AI Gateway (real LLM or the
// rule-based fallback) often returns lightweight markdown (**bold** labels,
// "- " separated fields) with no guarantee of real newlines, and until now
// every call site just dumped that raw string into a <p>, showing literal
// asterisks instead of bold text. This has no external dependency since the
// only markdown feature actually produced anywhere is **bold** text, plus
// occasional "- " separated fields on a single line.
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export default function FormattedText({ text, style }) {
  if (!text) return null;

  let lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  // A single long line with multiple "- **Label:**" fields (common LLM
  // output for structured summaries) reads far better as a list than as
  // one run-on paragraph.
  if (lines.length === 1) {
    const segments = lines[0].split(/\s+-\s+(?=\*\*)/).filter(Boolean);
    if (segments.length > 1) lines = segments;
  }

  if (lines.length > 1) {
    return (
      <ul style={{ margin: 0, paddingLeft: '1.2rem', ...style }}>
        {lines.map((line, i) => (
          <li key={i} style={{ marginBottom: '0.3rem' }}>{renderInline(line)}</li>
        ))}
      </ul>
    );
  }
  return <p style={{ margin: 0, ...style }}>{renderInline(lines[0])}</p>;
}
