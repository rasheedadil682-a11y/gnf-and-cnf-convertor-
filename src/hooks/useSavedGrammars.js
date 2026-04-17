import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cfg-converter-saved-grammars';

export function useSavedGrammars() {
  const [savedGrammars, setSavedGrammars] = useState([]);

  useEffect(() => { try { const s = localStorage.getItem(STORAGE_KEY); if (s) setSavedGrammars(JSON.parse(s)); } catch(e) { console.error(e); } }, []);

  const persist = useCallback((grammars) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(grammars)); } catch(e) { console.error(e); } }, []);

  const saveGrammar = useCallback((name, text, type) => {
    setSavedGrammars(prev => { const n = [...prev, { name, text, type, timestamp: Date.now() }]; persist(n); return n; });
  }, [persist]);

  const deleteGrammar = useCallback((index) => {
    setSavedGrammars(prev => { const n = prev.filter((_, i) => i !== index); persist(n); return n; });
  }, [persist]);

  const clearAll = useCallback(() => { setSavedGrammars([]); persist([]); }, [persist]);

  return { savedGrammars, saveGrammar, deleteGrammar, clearAll };
}
