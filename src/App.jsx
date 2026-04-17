import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header.jsx';
import GrammarInput from './components/GrammarInput.jsx';
import StepVisualization from './components/StepVisualization.jsx';
import TheoryPanel from './components/TheoryPanel.jsx';
import { useStepNavigation } from './hooks/useStepNavigation.js';
import { useSavedGrammars } from './hooks/useSavedGrammars.js';
import { runConversion } from './utils/conversionPipeline.js';
import { SAMPLE_GRAMMARS } from './utils/grammarParser.js';

export default function App() {
  const [grammarText, setGrammarText] = useState(SAMPLE_GRAMMARS['Simple CFG'].text);
  const [inputType, setInputType] = useState('CFG');
  const [targetType, setTargetType] = useState('CNF');
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(false);

  const navigation = useStepNavigation(steps);
  const { savedGrammars, saveGrammar, deleteGrammar } = useSavedGrammars();

  const handleConvert = useCallback(() => {
    setError(null);
    setIsConverting(true);
    setTimeout(() => {
      try {
        const { steps: s, result: r } = runConversion(grammarText, inputType, targetType);
        setSteps(s);
        setResult(r);
      } catch (e) {
        setError(e.message);
        setSteps([]);
        setResult(null);
      } finally {
        setIsConverting(false);
      }
    }, 400);
  }, [grammarText, inputType, targetType]);

  const handleLoadGrammar = useCallback((idx) => {
    const sg = savedGrammars[idx];
    if (sg) { setGrammarText(sg.text); setInputType(sg.type); setSteps([]); setResult(null); setError(null); }
  }, [savedGrammars]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ margin: '0 20px 12px', padding: '12px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--neon-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{'\u26A0'} Error: {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-red)', cursor: 'pointer', fontSize: '1rem' }}>{'\u2715'}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConverting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,26,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 50, height: 50, border: '3px solid var(--border-glass)', borderTopColor: 'var(--neon-blue)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Converting {inputType} {'\u2192'} {targetType}...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: 16, padding: '0 20px 20px', flex: 1, alignItems: 'start' }}>
        <GrammarInput grammarText={grammarText} setGrammarText={setGrammarText} inputType={inputType} setInputType={setInputType} targetType={targetType} setTargetType={setTargetType} onConvert={handleConvert} savedGrammars={savedGrammars} onSaveGrammar={saveGrammar} onLoadGrammar={handleLoadGrammar} onDeleteGrammar={deleteGrammar} />
        <StepVisualization steps={steps} navigation={navigation} inputType={inputType} targetType={targetType} />
        <TheoryPanel steps={steps} result={result} inputType={inputType} targetType={targetType} originalText={grammarText} beginnerMode={beginnerMode} setBeginnerMode={setBeginnerMode} />
      </div>

      <footer style={{ padding: '12px 20px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)' }}>
        CFG / CNF / GNF Universal Converter {'\u2014'} Built with React + Vite {'\u2022'} No backend required
      </footer>
    </div>
  );
}
