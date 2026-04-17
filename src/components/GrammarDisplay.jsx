import { motion } from 'framer-motion';
import { EPSILON } from '../utils/grammarParser.js';

export default function GrammarDisplay({ grammarText, label, compact = false }) {
  if (!grammarText) return null;
  const lines = grammarText.split('\n');
  return (
    <div>
      {label && <div className="comparison-label">{label}</div>}
      <div className="grammar-display" style={compact ? { padding: 12, fontSize: '0.8rem' } : {}}>
        {lines.map((line, i) => <div key={i}><HighlightedLine line={line} /></div>)}
      </div>
    </div>
  );
}

function HighlightedLine({ line }) {
  const arrowMatch = line.match(/^(\s*)([\w']+)(\s*)(\u2192|->|:)(\s*)(.*)$/);
  if (!arrowMatch) return <span style={{ color: 'var(--text-secondary)' }}>{line}</span>;
  const [, leading, lhs, , arrow, , rhs] = arrowMatch;
  const alternatives = rhs.split(/(\s*\|\s*)/);
  return (
    <span>
      {leading}
      <span className="variable">{lhs}</span>
      <span className="arrow"> {arrow} </span>
      {alternatives.map((part, i) => {
        if (part.match(/^\s*\|\s*$/)) return <span key={i} className="separator"> | </span>;
        return <HighlightedBody key={i} body={part.trim()} />;
      })}
    </span>
  );
}

function HighlightedBody({ body }) {
  if (!body || body === EPSILON || body === '\u03B5' || body === '\u03F5') return <span className="epsilon">{EPSILON}</span>;
  const tokens = [];
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === ' ') { tokens.push({ type: 'space', text: ' ' }); i++; }
    else if (/[A-Z]/.test(ch)) {
      let tok = ch; i++;
      while (i < body.length && (/[0-9'_]/.test(body[i]) || body[i] === '\u2032' || body[i] === '\u2019')) { tok += body[i]; i++; }
      tokens.push({ type: 'variable', text: tok });
    } else { tokens.push({ type: 'terminal', text: ch }); i++; }
  }
  return <>{tokens.map((tok, i) => {
    if (tok.type === 'variable') return <span key={i} className="variable">{tok.text}</span>;
    if (tok.type === 'terminal') return <span key={i} className="terminal">{tok.text}</span>;
    return <span key={i}>{tok.text}</span>;
  })}</>;
}

export function GrammarComparison({ beforeGrammar, afterGrammar }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="comparison-grid">
      <GrammarDisplay grammarText={beforeGrammar} label="Before" />
      <GrammarDisplay grammarText={afterGrammar} label="After" />
    </motion.div>
  );
}

export function GrammarTripleComparison({ original, intermediate, final }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      <GrammarDisplay grammarText={original} label="Original" />
      <GrammarDisplay grammarText={intermediate} label="Current Step" />
      <GrammarDisplay grammarText={final} label="Final" />
    </motion.div>
  );
}
