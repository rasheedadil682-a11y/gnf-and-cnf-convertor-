import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card-static"
      style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 16px 16px', borderTop: 'none', marginBottom: '20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: 'var(--glow-purple)' }}>
          ⚙
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple), var(--neon-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            CFG / CNF / GNF Converter
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Universal Grammar Converter with Step-by-Step Visualization
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--neon-green)', fontWeight: 600 }}>Frontend Only</span>
        </div>
        <div className="tooltip-wrap" data-tooltip="Arrow Keys: Navigate | Space: Play/Pause | Home/End: First/Last" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'help', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⌨ Shortcuts
        </div>
      </div>
    </motion.header>
  );
}
