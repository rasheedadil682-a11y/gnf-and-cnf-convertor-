import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SAMPLE_GRAMMARS, validateGrammar, parseGrammar } from '../utils/grammarParser.js';

export default function GrammarInput({ grammarText, setGrammarText, inputType, setInputType, targetType, setTargetType, onConvert, savedGrammars, onSaveGrammar, onLoadGrammar, onDeleteGrammar }) {
  const [showSamples, setShowSamples] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidation, setShowValidation] = useState(false);

  const handleValidate = () => {
    try { const g = parseGrammar(grammarText); const r = validateGrammar(g); setValidationErrors(r.errors); setShowValidation(true); }
    catch (e) { setValidationErrors([e.message]); setShowValidation(true); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="section-title"><span className="icon">📝</span>Grammar Input</div>

      {/* Conversion selectors */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Input Type</label>
          <select className="select-styled" value={inputType} onChange={e => setInputType(e.target.value)} style={{ width: '100%' }} id="input-type-select">
            <option value="CFG">CFG</option><option value="CNF">CNF</option><option value="GNF">GNF</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '1.2rem', color: 'var(--neon-purple)' }}>{'\u2192'}</motion.span>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Type</label>
          <select className="select-styled" value={targetType} onChange={e => setTargetType(e.target.value)} style={{ width: '100%' }} id="target-type-select">
            <option value="CFG">CFG</option><option value="CNF">CNF</option><option value="GNF">GNF</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <span className="badge badge-blue">{inputType}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{'\u2192'}</span>
        <span className="badge badge-purple">{targetType}</span>
      </div>

      {/* Grammar textarea */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grammar Rules</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ghost" onClick={() => setShowSamples(!showSamples)} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>📚 Samples</button>
            <button className="btn-ghost" onClick={() => setShowSaved(!showSaved)} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>💾 Saved</button>
          </div>
        </div>
        <textarea className="textarea-grammar" value={grammarText} onChange={e => { setGrammarText(e.target.value); setShowValidation(false); }} placeholder={'Enter grammar rules:\nS \u2192 AB | a\nA \u2192 BC | a\nB \u2192 b | \u03B5\nC \u2192 c'} spellCheck={false} id="grammar-input-textarea" />
      </div>

      {/* Validation */}
      <AnimatePresence>
        {showValidation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ padding: '10px 14px', borderRadius: 10, background: validationErrors.length === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (validationErrors.length === 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)') }}>
            {validationErrors.length === 0 ? <div style={{ fontSize: '0.8rem', color: 'var(--neon-green)' }}>{'\u2713'} Grammar is valid</div> :
              <div><div style={{ fontSize: '0.8rem', color: 'var(--neon-red)', marginBottom: 4 }}>{'\u2717'} Validation errors:</div>
                {validationErrors.map((err, i) => <div key={i} style={{ fontSize: '0.75rem', color: 'var(--neon-red)', opacity: 0.8, paddingLeft: 12 }}>{'\u2022'} {err}</div>)}
              </div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={() => { setShowValidation(false); onConvert(); }} style={{ flex: 1 }} id="convert-button">{'\u26A1'} Convert {inputType} {'\u2192'} {targetType}</button>
        <button className="btn-ghost" onClick={handleValidate} id="validate-button">{'\u2713'} Validate</button>
      </div>

      {/* Samples */}
      <AnimatePresence>
        {showSamples && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample Grammars</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(SAMPLE_GRAMMARS).map(([name, sample]) => (
                <motion.button key={name} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => { setGrammarText(sample.text); setInputType(sample.type); setShowSamples(false); setShowValidation(false); }}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{name}</span>
                    <span className={'badge ' + (sample.type === 'CNF' ? 'badge-blue' : sample.type === 'GNF' ? 'badge-green' : 'badge-purple')}>{sample.type}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sample.description}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved grammars */}
      <AnimatePresence>
        {showSaved && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Grammars</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input className="input-styled" placeholder="Name for this grammar..." value={saveName} onChange={e => setSaveName(e.target.value)} style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px' }} />
              <button className="btn-ghost" onClick={() => { if (saveName.trim() && grammarText.trim()) { onSaveGrammar(saveName.trim(), grammarText, inputType); setSaveName(''); } }} style={{ fontSize: '0.75rem' }}>Save</button>
            </div>
            {savedGrammars.length === 0 ? <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No saved grammars yet.</div> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {savedGrammars.map((sg, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                    <div><span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{sg.name}</span><span className="badge badge-blue" style={{ marginLeft: 8 }}>{sg.type}</span></div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-ghost" onClick={() => { onLoadGrammar(idx); setShowSaved(false); setShowValidation(false); }} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>Load</button>
                      <button className="btn-ghost" onClick={() => onDeleteGrammar(idx)} style={{ fontSize: '0.7rem', padding: '3px 8px', color: 'var(--neon-red)' }}>{'\u2715'}</button>
                    </div>
                  </div>
                ))}
              </div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syntax guide */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--neon-blue)', fontWeight: 600, marginBottom: 4 }}>💡 Syntax Guide</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {'\u2022'} Use <span style={{ color: 'var(--neon-cyan)' }}>UPPERCASE</span> for non-terminals (variables)<br />
          {'\u2022'} Use <span style={{ color: 'var(--neon-amber)' }}>lowercase</span> for terminals<br />
          {'\u2022'} Separate alternatives with <span style={{ color: 'var(--neon-pink)' }}>|</span><br />
          {'\u2022'} Use <span style={{ color: 'var(--neon-green)' }}>{'\u2192'}</span> or <span style={{ color: 'var(--neon-green)' }}>{'->'}</span> or <span style={{ color: 'var(--neon-green)' }}>:</span> as arrow<br />
          {'\u2022'} Use <span style={{ color: 'var(--neon-green)' }}>{'\u03B5'}</span> or empty for epsilon
        </div>
      </div>
    </motion.div>
  );
}
