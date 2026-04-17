import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GrammarDisplay, { GrammarComparison, GrammarTripleComparison } from './GrammarDisplay.jsx';

export default function StepVisualization({ steps, navigation, inputType, targetType }) {
  const [viewMode, setViewMode] = useState('split');
  const { step, currentStep, totalSteps, isFirst, isLast } = navigation;

  if (!steps || steps.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-static" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '3rem', marginBottom: 20, opacity: 0.3 }}>⚙</motion.div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Enter a Grammar & Convert</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 340 }}>Select input and target types, enter grammar rules, and click Convert to see step-by-step transformation.</div>
      </motion.div>
    );
  }

  const originalGrammar = steps[0]?.afterGrammar;
  const finalGrammar = steps[steps.length - 1]?.afterGrammar;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}><span className="icon">🔬</span>Step Visualization</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-blue">{inputType}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{'\u2192'}</span>
          <span className="badge badge-purple">{targetType}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline" style={{ justifyContent: 'center' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <motion.button className={'timeline-dot ' + (i === currentStep ? 'active' : '') + ' ' + (i < currentStep ? 'completed' : '')} whileHover={{ scale: 1.4 }} whileTap={{ scale: 0.9 }} onClick={() => navigation.goToStep(i)} title={s.stepTitle} />
            {i < totalSteps - 1 && <div className={'timeline-line ' + (i < currentStep ? 'completed' : '')} />}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon tooltip-wrap" data-tooltip="First (Home)" onClick={navigation.firstStep} disabled={isFirst}>{'\u23EE'}</button>
          <button className="btn-icon tooltip-wrap" data-tooltip="Prev (\u2190)" onClick={navigation.prevStep} disabled={isFirst}>{'\u25C0'}</button>
          <button className="btn-icon tooltip-wrap" data-tooltip={navigation.isPlaying ? 'Pause (Space)' : 'Play (Space)'} onClick={navigation.togglePlay} style={navigation.isPlaying ? { background: 'rgba(59,130,246,0.2)', borderColor: 'var(--neon-blue)' } : {}}>{navigation.isPlaying ? '\u23F8' : '\u25B6'}</button>
          <button className="btn-icon tooltip-wrap" data-tooltip="Next (\u2192)" onClick={navigation.nextStep} disabled={isLast}>{'\u25B6'}</button>
          <button className="btn-icon tooltip-wrap" data-tooltip="Last (End)" onClick={navigation.lastStep} disabled={isLast}>{'\u23ED'}</button>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Step {currentStep + 1} / {totalSteps}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Speed</span>
          <input type="range" className="speed-slider" min={500} max={5000} step={250} value={navigation.speed} onChange={e => navigation.setSpeed(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: 30 }}>{(navigation.speed / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* View mode tabs */}
      <div className="tab-bar">
        <button className={'tab-btn ' + (viewMode === 'split' ? 'active' : '')} onClick={() => setViewMode('split')}>Split View</button>
        <button className={'tab-btn ' + (viewMode === 'before' ? 'active' : '')} onClick={() => setViewMode('before')}>Before</button>
        <button className={'tab-btn ' + (viewMode === 'after' ? 'active' : '')} onClick={() => setViewMode('after')}>After</button>
        <button className={'tab-btn ' + (viewMode === 'compare3' ? 'active' : '')} onClick={() => setViewMode('compare3')}>3-Way Compare</button>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {step?.stepTitle?.includes('\u2550') ? <span style={{ background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{step.stepTitle}</span> : step?.stepTitle}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', whiteSpace: 'pre-wrap' }}>{step?.description}</div>

          {viewMode === 'split' && <GrammarComparison beforeGrammar={step?.beforeGrammar} afterGrammar={step?.afterGrammar} />}
          {viewMode === 'before' && <GrammarDisplay grammarText={step?.beforeGrammar} label="Before" />}
          {viewMode === 'after' && <GrammarDisplay grammarText={step?.afterGrammar} label="After" />}
          {viewMode === 'compare3' && <GrammarTripleComparison original={originalGrammar} intermediate={step?.afterGrammar} final={finalGrammar} />}

          {step?.changes && (step.changes.added.length > 0 || step.changes.removed.length > 0) && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Changes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {step.changes.added.map((r, i) => <motion.span key={'a' + i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="tag-added">+ {r}</motion.span>)}
                {step.changes.removed.map((r, i) => <motion.span key={'r' + i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="tag-removed">{'\u2212'} {r}</motion.span>)}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
