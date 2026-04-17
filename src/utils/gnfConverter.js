/**
 * gnfConverter.js - Converts CFG to Greibach Normal Form step by step
 */
import { cloneGrammar, grammarToString, isVariable, isTerminal, freshVariable, EPSILON } from './grammarParser.js';

function describeChanges(before, after) {
  const changes = { added: [], removed: [], modified: [] };
  const bProds = new Map();
  for (const [v, bodies] of before.productions) bProds.set(v, bodies.map(b => b.join('')));
  const aProds = new Map();
  for (const [v, bodies] of after.productions) aProds.set(v, bodies.map(b => b.join('')));
  for (const [v, bodyStrs] of aProds) {
    if (!bProds.has(v)) { changes.added.push(...bodyStrs.map(b => v + ' \u2192 ' + (b || EPSILON))); }
    else { const old = new Set(bProds.get(v)); for (const b of bodyStrs) { if (!old.has(b)) changes.added.push(v + ' \u2192 ' + (b || EPSILON)); } }
  }
  for (const [v, bodyStrs] of bProds) {
    if (!aProds.has(v)) { changes.removed.push(...bodyStrs.map(b => v + ' \u2192 ' + (b || EPSILON))); }
    else { const cur = new Set(aProds.get(v)); for (const b of bodyStrs) { if (!cur.has(b)) changes.removed.push(v + ' \u2192 ' + (b || EPSILON)); } }
  }
  return changes;
}

function addNewStart(grammar) {
  let startOnRHS = false;
  for (const [, bodies] of grammar.productions) { for (const body of bodies) { if (body.includes(grammar.startSymbol)) { startOnRHS = true; break; } } if (startOnRHS) break; }
  if (!startOnRHS) return { grammar, skipped: true };
  const g = cloneGrammar(grammar);
  const newStart = freshVariable(g.variables, 'S0');
  g.variables.add(newStart);
  const newProds = new Map();
  newProds.set(newStart, [[grammar.startSymbol]]);
  for (const [k, v] of g.productions) newProds.set(k, v);
  g.productions = newProds;
  g.startSymbol = newStart;
  return { grammar: g, skipped: false };
}

function findNullable(grammar) {
  const nullable = new Set();
  for (const [v, bodies] of grammar.productions) { for (const body of bodies) { if (body.length === 0) nullable.add(v); } }
  let changed = true;
  while (changed) { changed = false; for (const [v, bodies] of grammar.productions) { if (nullable.has(v)) continue; for (const body of bodies) { if (body.every(sym => nullable.has(sym))) { nullable.add(v); changed = true; break; } } } }
  return nullable;
}

function removeEpsilonProductions(grammar) {
  const nullable = findNullable(grammar);
  if (nullable.size === 0) return { grammar: cloneGrammar(grammar), skipped: true, nullable };
  const g = cloneGrammar(grammar);
  const newProductions = new Map();
  for (const [v, bodies] of g.productions) {
    const newBodies = new Set();
    for (const body of bodies) {
      if (body.length === 0) continue;
      const np = []; for (let i = 0; i < body.length; i++) { if (nullable.has(body[i])) np.push(i); }
      for (let mask = 0; mask < (1 << np.length); mask++) {
        const skip = new Set(); for (let j = 0; j < np.length; j++) { if (mask & (1 << j)) skip.add(np[j]); }
        const nb = body.filter((_, i) => !skip.has(i));
        if (nb.length > 0) newBodies.add(nb.join('\x00'));
      }
    }
    const result = [...newBodies].map(s => s.split('\x00'));
    if (v === g.startSymbol && nullable.has(v)) result.push([]);
    if (result.length > 0) newProductions.set(v, result);
  }
  g.productions = newProductions;
  return { grammar: g, skipped: false, nullable };
}

function removeUnitProductions(grammar) {
  const g = cloneGrammar(grammar);
  const unitPairs = new Map();
  for (const v of g.variables) unitPairs.set(v, new Set([v]));
  let changed = true;
  while (changed) { changed = false; for (const [v, bodies] of g.productions) { for (const body of bodies) { if (body.length === 1 && isVariable(body[0])) { const cp = unitPairs.get(v); const tp = unitPairs.get(body[0]); if (tp) { for (const t of tp) { if (!cp.has(t)) { cp.add(t); changed = true; } } } } } } }
  let hasUnit = false;
  for (const [, bodies] of g.productions) { for (const body of bodies) { if (body.length === 1 && isVariable(body[0])) { hasUnit = true; break; } } if (hasUnit) break; }
  if (!hasUnit) return { grammar: g, skipped: true };
  const newProductions = new Map();
  for (const [v] of g.productions) {
    const newBodies = [];
    const reachable = unitPairs.get(v) || new Set([v]);
    for (const u of reachable) { if (!g.productions.has(u)) continue; for (const body of g.productions.get(u)) { if (body.length === 1 && isVariable(body[0])) continue; const key = body.join('\x00'); if (!newBodies.some(b => b.join('\x00') === key)) newBodies.push([...body]); } }
    if (newBodies.length > 0) newProductions.set(v, newBodies);
  }
  g.productions = newProductions;
  return { grammar: g, skipped: false };
}

function removeUselessSymbols(grammar) {
  const g = cloneGrammar(grammar);
  const generating = new Set();
  for (const t of g.terminals) generating.add(t);
  let changed = true;
  while (changed) { changed = false; for (const [v, bodies] of g.productions) { if (generating.has(v)) continue; for (const body of bodies) { if (body.length === 0 || body.every(sym => generating.has(sym))) { generating.add(v); changed = true; break; } } } }
  const genProds = new Map();
  for (const [v, bodies] of g.productions) { if (!generating.has(v)) continue; const f = bodies.filter(body => body.every(sym => generating.has(sym))); if (f.length > 0) genProds.set(v, f); }
  const reachable = new Set(); const queue = [g.startSymbol]; reachable.add(g.startSymbol);
  while (queue.length > 0) { const v = queue.shift(); if (!genProds.has(v)) continue; for (const body of genProds.get(v)) { for (const sym of body) { if (!reachable.has(sym)) { reachable.add(sym); if (isVariable(sym)) queue.push(sym); } } } }
  const finalProds = new Map();
  for (const [v, bodies] of genProds) { if (!reachable.has(v)) continue; const f = bodies.filter(body => body.every(sym => reachable.has(sym))); if (f.length > 0) finalProds.set(v, f); }
  const removedVars = [...g.variables].filter(v => !reachable.has(v) || !generating.has(v));
  g.productions = finalProds;
  g.variables = new Set([...g.variables].filter(v => finalProds.has(v)));
  g.terminals = new Set();
  for (const [, bodies] of finalProds) { for (const body of bodies) { for (const sym of body) { if (isTerminal(sym)) g.terminals.add(sym); } } }
  return { grammar: g, skipped: removedVars.length === 0, removedVars };
}

function removeLeftRecursion(grammar) {
  const g = cloneGrammar(grammar);
  const vars = [...g.productions.keys()];
  let madeChanges = false;
  for (let i = 0; i < vars.length; i++) {
    const ai = vars[i];
    for (let j = 0; j < i; j++) {
      const aj = vars[j];
      if (!g.productions.has(ai)) continue;
      const newBodies = []; let substituted = false;
      for (const body of g.productions.get(ai)) {
        if (body.length > 0 && body[0] === aj) {
          substituted = true;
          if (g.productions.has(aj)) { for (const ajBody of g.productions.get(aj)) newBodies.push([...ajBody, ...body.slice(1)]); }
        } else { newBodies.push([...body]); }
      }
      if (substituted) { madeChanges = true; g.productions.set(ai, newBodies); }
    }
    if (!g.productions.has(ai)) continue;
    const bodies = g.productions.get(ai);
    const recursive = []; const nonRecursive = [];
    for (const body of bodies) { if (body.length > 0 && body[0] === ai) recursive.push(body.slice(1)); else nonRecursive.push(body); }
    if (recursive.length > 0) {
      madeChanges = true;
      const newVar = freshVariable(g.variables, ai + "'");
      g.variables.add(newVar);
      const aiProds = [];
      for (const nr of nonRecursive) { aiProds.push([...nr]); aiProds.push([...nr, newVar]); }
      const newVarProds = [];
      for (const r of recursive) { newVarProds.push([...r]); newVarProds.push([...r, newVar]); }
      g.productions.set(ai, aiProds);
      g.productions.set(newVar, newVarProds);
    }
  }
  return { grammar: g, skipped: !madeChanges };
}

function backSubstitute(grammar) {
  const g = cloneGrammar(grammar);
  const vars = [...g.productions.keys()];
  let madeChanges = false;
  let iterations = 0;
  let allStartWithTerminal = false;
  while (!allStartWithTerminal && iterations < 50) {
    allStartWithTerminal = true; iterations++;
    for (let i = vars.length - 1; i >= 0; i--) {
      const v = vars[i];
      if (!g.productions.has(v)) continue;
      const newBodies = []; let substituted = false;
      for (const body of g.productions.get(v)) {
        if (body.length === 0) { newBodies.push([]); continue; }
        if (isTerminal(body[0])) { newBodies.push([...body]); continue; }
        const firstVar = body[0];
        if (g.productions.has(firstVar)) { substituted = true; allStartWithTerminal = false; for (const subBody of g.productions.get(firstVar)) newBodies.push([...subBody, ...body.slice(1)]); }
        else { newBodies.push([...body]); }
      }
      if (substituted) { madeChanges = true; const seen = new Set(); const deduped = []; for (const b of newBodies) { const key = b.join('\x00'); if (!seen.has(key)) { seen.add(key); deduped.push(b); } } g.productions.set(v, deduped); }
    }
    for (const [v, bodies] of g.productions) {
      if (vars.includes(v)) continue;
      const newBodies = []; let substituted = false;
      for (const body of bodies) {
        if (body.length === 0 || isTerminal(body[0])) { newBodies.push([...body]); continue; }
        const firstVar = body[0];
        if (g.productions.has(firstVar) && firstVar !== v) { substituted = true; allStartWithTerminal = false; for (const subBody of g.productions.get(firstVar)) newBodies.push([...subBody, ...body.slice(1)]); }
        else { newBodies.push([...body]); if (isVariable(body[0])) allStartWithTerminal = false; }
      }
      if (substituted) { madeChanges = true; const seen = new Set(); const deduped = []; for (const b of newBodies) { const key = b.join('\x00'); if (!seen.has(key)) { seen.add(key); deduped.push(b); } } g.productions.set(v, deduped); }
    }
  }
  return { grammar: g, skipped: !madeChanges };
}

function replaceNonLeadingTerminals(grammar) {
  const g = cloneGrammar(grammar);
  const terminalVars = new Map();
  let madeChanges = false;
  const newProductions = new Map();
  for (const [v, bodies] of g.productions) {
    const newBodies = [];
    for (const body of bodies) {
      if (body.length <= 1) { newBodies.push([...body]); continue; }
      const newBody = body.map((sym, idx) => {
        if (idx > 0 && isTerminal(sym)) {
          if (!terminalVars.has(sym)) { const nv = freshVariable(g.variables, sym.toUpperCase() + '_'); g.variables.add(nv); terminalVars.set(sym, nv); }
          madeChanges = true; return terminalVars.get(sym);
        }
        return sym;
      });
      newBodies.push(newBody);
    }
    newProductions.set(v, newBodies);
  }
  for (const [terminal, varName] of terminalVars) newProductions.set(varName, [[terminal]]);
  g.productions = newProductions;
  return { grammar: g, skipped: !madeChanges, terminalVars };
}

export function convertToGNF(grammar) {
  const steps = [];
  let current = cloneGrammar(grammar);
  steps.push({ stepTitle: 'Original Grammar', description: 'This is the input grammar before any transformations.', beforeGrammar: grammarToString(current), afterGrammar: grammarToString(current), changes: { added: [], removed: [], modified: [] } });

  const s1 = addNewStart(current); const b1 = grammarToString(current);
  if (!s1.skipped) { current = s1.grammar; steps.push({ stepTitle: 'Step 1: Add New Start Symbol', description: 'Start symbol appears on RHS. New start "' + current.startSymbol + '" introduced.', beforeGrammar: b1, afterGrammar: grammarToString(current), changes: describeChanges(grammar, current) }); }
  else { steps.push({ stepTitle: 'Step 1: Add New Start Symbol', description: 'Start symbol not on any RHS. Skipped.', beforeGrammar: b1, afterGrammar: b1, changes: { added: [], removed: [], modified: [] } }); }

  const b2 = grammarToString(current); const p2 = cloneGrammar(current); const s2 = removeEpsilonProductions(current);
  if (!s2.skipped) { current = s2.grammar; steps.push({ stepTitle: 'Step 2: Remove \u03B5-Productions', description: 'Nullable: {' + [...s2.nullable].join(', ') + '}. Epsilon productions removed, combinations generated.', beforeGrammar: b2, afterGrammar: grammarToString(current), changes: describeChanges(p2, current) }); }
  else { steps.push({ stepTitle: 'Step 2: Remove \u03B5-Productions', description: 'No epsilon productions. Skipped.', beforeGrammar: b2, afterGrammar: b2, changes: { added: [], removed: [], modified: [] } }); }

  const b3 = grammarToString(current); const p3 = cloneGrammar(current); const s3 = removeUnitProductions(current);
  if (!s3.skipped) { current = s3.grammar; steps.push({ stepTitle: 'Step 3: Remove Unit Productions', description: 'Unit productions (A \u2192 B) removed. Non-unit productions propagated.', beforeGrammar: b3, afterGrammar: grammarToString(current), changes: describeChanges(p3, current) }); }
  else { steps.push({ stepTitle: 'Step 3: Remove Unit Productions', description: 'No unit productions. Skipped.', beforeGrammar: b3, afterGrammar: b3, changes: { added: [], removed: [], modified: [] } }); }

  const b4 = grammarToString(current); const p4 = cloneGrammar(current); const s4 = removeUselessSymbols(current);
  if (!s4.skipped) { current = s4.grammar; steps.push({ stepTitle: 'Step 4: Remove Useless Symbols', description: 'Removed: {' + s4.removedVars.join(', ') + '}.', beforeGrammar: b4, afterGrammar: grammarToString(current), changes: describeChanges(p4, current) }); }
  else { steps.push({ stepTitle: 'Step 4: Remove Useless Symbols', description: 'All symbols useful. Skipped.', beforeGrammar: b4, afterGrammar: b4, changes: { added: [], removed: [], modified: [] } }); }

  const b5 = grammarToString(current); const p5 = cloneGrammar(current); const s5 = removeLeftRecursion(current);
  if (!s5.skipped) { current = s5.grammar; steps.push({ stepTitle: 'Step 5: Remove Left Recursion', description: 'Left recursion removed by variable ordering and standard elimination. New primed variables may be introduced.', beforeGrammar: b5, afterGrammar: grammarToString(current), changes: describeChanges(p5, current) }); }
  else { steps.push({ stepTitle: 'Step 5: Remove Left Recursion', description: 'No left recursion detected. Skipped.', beforeGrammar: b5, afterGrammar: b5, changes: { added: [], removed: [], modified: [] } }); }

  const b6 = grammarToString(current); const p6 = cloneGrammar(current); const s6 = backSubstitute(current);
  if (!s6.skipped) { current = s6.grammar; steps.push({ stepTitle: 'Step 6: Back-Substitute for Terminal-Leading', description: 'Variables at production starts replaced by their productions until every production starts with a terminal.', beforeGrammar: b6, afterGrammar: grammarToString(current), changes: describeChanges(p6, current) }); }
  else { steps.push({ stepTitle: 'Step 6: Back-Substitute for Terminal-Leading', description: 'All productions already start with a terminal. Skipped.', beforeGrammar: b6, afterGrammar: b6, changes: { added: [], removed: [], modified: [] } }); }

  const b7 = grammarToString(current); const p7 = cloneGrammar(current); const s7 = replaceNonLeadingTerminals(current);
  if (!s7.skipped) { current = s7.grammar; const m = [...s7.terminalVars.entries()].map(([t, v]) => t + ' \u2192 ' + v).join(', '); steps.push({ stepTitle: 'Step 7: Replace Non-Leading Terminals', description: 'Terminals in non-leading positions replaced with new variables. Mappings: ' + m, beforeGrammar: b7, afterGrammar: grammarToString(current), changes: describeChanges(p7, current) }); }
  else { steps.push({ stepTitle: 'Step 7: Replace Non-Leading Terminals', description: 'No non-leading terminals to replace. Skipped.', beforeGrammar: b7, afterGrammar: b7, changes: { added: [], removed: [], modified: [] } }); }

  steps.push({ stepTitle: 'Final Result: Greibach Normal Form', description: 'The grammar is now in GNF. Every production starts with a terminal followed by zero or more variables.', beforeGrammar: grammarToString(grammar), afterGrammar: grammarToString(current), changes: describeChanges(grammar, current) });

  return { steps, result: current };
}
