import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEORY } from '../utils/conversionPipeline.js';
import { grammarToString } from '../utils/grammarParser.js';

export default function TheoryPanel({ steps, result, inputType, targetType, originalText, beginnerMode, setBeginnerMode }) {
  const [activeTab, setActiveTab] = useState('explanation');
  const [expandedTheory, setExpandedTheory] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}><span className="icon">📚</span>Theory & Details</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Beginner</span>
          <label className="toggle-switch"><input type="checkbox" checked={beginnerMode} onChange={e => setBeginnerMode(e.target.checked)} /><span className="toggle-slider"></span></label>
        </div>
      </div>

      <div className="tab-bar">
        <button className={'tab-btn ' + (activeTab === 'explanation' ? 'active' : '')} onClick={() => setActiveTab('explanation')}>Explanation</button>
        <button className={'tab-btn ' + (activeTab === 'theory' ? 'active' : '')} onClick={() => setActiveTab('theory')}>Theory</button>
        <button className={'tab-btn ' + (activeTab === 'result' ? 'active' : '')} onClick={() => setActiveTab('result')} disabled={!result}>Result</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'explanation' && (
          <motion.div key="explanation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConversionExplanation inputType={inputType} targetType={targetType} beginnerMode={beginnerMode} />
          </motion.div>
        )}
        {activeTab === 'theory' && (
          <motion.div key="theory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(THEORY).map(([key, theory]) => (
              <TheoryCard key={key} theory={theory} expanded={expandedTheory === key} onToggle={() => setExpandedTheory(expandedTheory === key ? null : key)} beginnerMode={beginnerMode} />
            ))}
          </motion.div>
        )}
        {activeTab === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultPanel result={result} inputType={inputType} targetType={targetType} originalText={originalText} stepsCount={steps?.length || 0} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ConversionExplanation({ inputType, targetType, beginnerMode }) {
  const explanations = {
    'CFG\u2192CNF': { title: 'CFG \u2192 Chomsky Normal Form', steps: ['Add new start symbol (if needed)', 'Remove \u03B5-productions (nullable variables)', 'Remove unit productions (A \u2192 B)', 'Remove useless symbols', 'Replace terminals in long productions', 'Convert to binary form'], why: 'CNF enables the CYK parsing algorithm and simplifies theoretical proofs.', beginner: 'We clean up rules so every rule has exactly 2 variables OR 1 letter. This makes checking strings easy!' },
    'CFG\u2192GNF': { title: 'CFG \u2192 Greibach Normal Form', steps: ['Add new start symbol (if needed)', 'Remove \u03B5-productions', 'Remove unit productions', 'Remove useless symbols', 'Remove left recursion', 'Back-substitute for terminal-leading', 'Replace non-leading terminals'], why: 'GNF eliminates left recursion and enables efficient top-down parsing.', beginner: 'We want every rule to start with a lowercase letter \u2014 reading left-to-right, we always make progress!' },
    'CNF\u2192CFG': { title: 'CNF \u2192 Context-Free Grammar', steps: ['Recognize CNF is a subset of CFG', 'Identify production patterns', 'No structural changes needed'], why: 'CNF is already a valid CFG. Understanding the relationship.', beginner: 'Good news \u2014 a CNF grammar IS already a CFG! No changes needed.' },
    'GNF\u2192CFG': { title: 'GNF \u2192 Context-Free Grammar', steps: ['Recognize GNF is a subset of CFG', 'Analyze production structure', 'No structural changes needed'], why: 'GNF is already a valid CFG with specific guarantees.', beginner: 'GNF is already a type of CFG! We just explain what makes it special.' },
    'GNF\u2192CNF': { title: 'GNF \u2192 CNF (Two-Phase)', steps: ['Phase 1: Recognize GNF as CFG', 'Phase 2: Apply CFG \u2192 CNF conversion', 'All standard CNF steps apply'], why: 'No direct path \u2014 we go through CFG as intermediate.', beginner: 'We say "this GNF is also a CFG", then convert that CFG to CNF!' },
    'CNF\u2192GNF': { title: 'CNF \u2192 GNF (Two-Phase)', steps: ['Phase 1: Recognize CNF as CFG', 'Phase 2: Apply CFG \u2192 GNF conversion', 'All standard GNF steps apply'], why: 'We treat CNF as CFG then apply GNF conversion.', beginner: 'First acknowledge CNF is a CFG, then convert to GNF!' },
  };
  const key = inputType + '\u2192' + targetType;
  const explanation = explanations[key];
  if (!explanation) return <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Select types and convert to see explanation.</div>;
  return (
    <div className="animate-fade-in">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{explanation.title}</h3>
      {beginnerMode && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.82rem', color: 'var(--neon-amber)', lineHeight: 1.6, marginBottom: 12 }}>🧸 {explanation.beginner}</div>}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--neon-purple)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Why this conversion?</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{explanation.why}</div>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Steps</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {explanation.steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--neon-blue)', flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TheoryCard({ theory, expanded, onToggle, beginnerMode }) {
  return (
    <div className="glass-card" style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={onToggle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{theory.title}</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{'\u25BC'}</motion.span>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{beginnerMode ? theory.beginner : theory.content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultPanel({ result, inputType, targetType, originalText, stepsCount }) {
  const [copied, setCopied] = useState(false);
  const resultText = grammarToString(result);
  const handleCopy = () => { navigator.clipboard.writeText(resultText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const handleExport = () => {
    const data = { conversion: inputType + ' \u2192 ' + targetType, original: originalText, result: resultText, variables: [...result.variables], terminals: [...result.terminals], startSymbol: result.startSymbol, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'grammar-' + inputType + '-to-' + targetType + '-' + Date.now() + '.json'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--neon-green)' }}>{'\u2713'} Conversion Complete</h3>
        <span className="badge badge-green">{stepsCount} steps</span>
      </div>
      <div>
        <div className="comparison-label">Final {targetType} Grammar</div>
        <div className="grammar-display" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>{resultText.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variables</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{[...result.variables].join(', ')}</div>
        </div>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terminals</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--neon-amber)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{[...result.terminals].join(', ')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" onClick={handleCopy} style={{ flex: 1 }} id="copy-result-button">{copied ? '\u2713 Copied!' : '📋 Copy Result'}</button>
        <button className="btn-ghost" onClick={handleExport} style={{ flex: 1 }} id="export-button">📥 Export JSON</button>
      </div>
    </div>
  );
}
