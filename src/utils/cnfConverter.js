/**
 * cnfConverter.js - Converts CFG to Chomsky Normal Form step by step
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
  for (const [, bodies] of grammar.productions) {
    for (const body of bodies) { if (body.includes(grammar.startSymbol)) { startOnRHS = true; break; } }
    if (startOnRHS) break;
  }
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
  while (changed) {
    changed = false;
    for (const [v, bodies] of grammar.productions) {
      if (nullable.has(v)) continue;
      for (const body of bodies) { if (body.every(sym => nullable.has(sym))) { nullable.add(v); changed = true; break; } }
    }
  }
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
      const nullablePositions = [];
      for (let i = 0; i < body.length; i++) { if (nullable.has(body[i])) nullablePositions.push(i); }
      const numSubsets = 1 << nullablePositions.length;
      for (let mask = 0; mask < numSubsets; mask++) {
        const skipSet = new Set();
        for (let j = 0; j < nullablePositions.length; j++) { if (mask & (1 << j)) skipSet.add(nullablePositions[j]); }
        const newBody = body.filter((_, i) => !skipSet.has(i));
        if (newBody.length > 0) newBodies.add(newBody.join('\x00'));
      }
    }
    const resultBodies = [...newBodies].map(s => s.split('\x00'));
    if (v === g.startSymbol && nullable.has(v)) resultBodies.push([]);
    if (resultBodies.length > 0) newProductions.set(v, resultBodies);
  }
  g.productions = newProductions;
  return { grammar: g, skipped: false, nullable };
}

function removeUnitProductions(grammar) {
  const g = cloneGrammar(grammar);
  const unitPairs = new Map();
  for (const v of g.variables) unitPairs.set(v, new Set([v]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [v, bodies] of g.productions) {
      for (const body of bodies) {
        if (body.length === 1 && isVariable(body[0])) {
          const currentPairs = unitPairs.get(v);
          const targetPairs = unitPairs.get(body[0]);
          if (targetPairs) { for (const t of targetPairs) { if (!currentPairs.has(t)) { currentPairs.add(t); changed = true; } } }
        }
      }
    }
  }
  let hasUnit = false;
  for (const [, bodies] of g.productions) { for (const body of bodies) { if (body.length === 1 && isVariable(body[0])) { hasUnit = true; break; } } if (hasUnit) break; }
  if (!hasUnit) return { grammar: g, skipped: true };
  const newProductions = new Map();
  for (const [v] of g.productions) {
    const newBodies = [];
    const reachable = unitPairs.get(v) || new Set([v]);
    for (const u of reachable) {
      if (!g.productions.has(u)) continue;
      for (const body of g.productions.get(u)) {
        if (body.length === 1 && isVariable(body[0])) continue;
        const key = body.join('\x00');
        if (!newBodies.some(b => b.join('\x00') === key)) newBodies.push([...body]);
      }
    }
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
  while (changed) {
    changed = false;
    for (const [v, bodies] of g.productions) {
      if (generating.has(v)) continue;
      for (const body of bodies) { if (body.length === 0 || body.every(sym => generating.has(sym))) { generating.add(v); changed = true; break; } }
    }
  }
  const genProds = new Map();
  for (const [v, bodies] of g.productions) {
    if (!generating.has(v)) continue;
    const filtered = bodies.filter(body => body.every(sym => generating.has(sym)));
    if (filtered.length > 0) genProds.set(v, filtered);
  }
  const reachable = new Set();
  const queue = [g.startSymbol];
  reachable.add(g.startSymbol);
  while (queue.length > 0) {
    const v = queue.shift();
    if (!genProds.has(v)) continue;
    for (const body of genProds.get(v)) { for (const sym of body) { if (!reachable.has(sym)) { reachable.add(sym); if (isVariable(sym)) queue.push(sym); } } }
  }
  const finalProds = new Map();
  for (const [v, bodies] of genProds) {
    if (!reachable.has(v)) continue;
    const filtered = bodies.filter(body => body.every(sym => reachable.has(sym)));
    if (filtered.length > 0) finalProds.set(v, filtered);
  }
  const removedVars = [...g.variables].filter(v => !reachable.has(v) || !generating.has(v));
  g.productions = finalProds;
  g.variables = new Set([...g.variables].filter(v => finalProds.has(v)));
  g.terminals = new Set();
  for (const [, bodies] of finalProds) { for (const body of bodies) { for (const sym of body) { if (isTerminal(sym)) g.terminals.add(sym); } } }
  return { grammar: g, skipped: removedVars.length === 0, removedVars };
}

function replaceTerminals(grammar) {
  const g = cloneGrammar(grammar);
  const terminalVars = new Map();
  let madeChanges = false;
  const newProductions = new Map();
  for (const [v, bodies] of g.productions) {
    const newBodies = [];
    for (const body of bodies) {
      if (body.length <= 1) { newBodies.push([...body]); continue; }
      const newBody = body.map(sym => {
        if (isTerminal(sym)) {
          if (!terminalVars.has(sym)) { const nv = freshVariable(g.variables, sym.toUpperCase() + '_'); g.variables.add(nv); terminalVars.set(sym, nv); }
          madeChanges = true;
          return terminalVars.get(sym);
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

function convertToBinary(grammar) {
  const g = cloneGrammar(grammar);
  let madeChanges = false;
  let chainIdx = 1;
  const newProductions = new Map();
  for (const [v, bodies] of g.productions) {
    const newBodies = [];
    for (const body of bodies) {
      if (body.length <= 2) { newBodies.push([...body]); continue; }
      madeChanges = true;
      let current = body;
      let currentVar = v;
      while (current.length > 2) {
        const newVar = freshVariable(g.variables, 'X' + chainIdx);
        chainIdx++;
        g.variables.add(newVar);
        if (currentVar === v) { newBodies.push([current[0], newVar]); }
        else { if (!newProductions.has(currentVar)) newProductions.set(currentVar, []); newProductions.get(currentVar).push([current[0], newVar]); }
        currentVar = newVar;
        current = current.slice(1);
      }
      if (!newProductions.has(currentVar)) newProductions.set(currentVar, []);
      newProductions.get(currentVar).push([...current]);
    }
    if (!newProductions.has(v)) newProductions.set(v, newBodies);
    else newProductions.get(v).push(...newBodies);
  }
  g.productions = newProductions;
  return { grammar: g, skipped: !madeChanges };
}

export function convertToCNF(grammar) {
  const steps = [];
  let current = cloneGrammar(grammar);

  steps.push({ stepTitle: 'Original Grammar', description: 'This is the input grammar before any transformations.', beforeGrammar: grammarToString(current), afterGrammar: grammarToString(current), changes: { added: [], removed: [], modified: [] } });

  // Step 1
  const s1 = addNewStart(current);
  const b1 = grammarToString(current);
  if (!s1.skipped) { const prev = current; current = s1.grammar; steps.push({ stepTitle: 'Step 1: Add New Start Symbol', description: 'The start symbol "' + grammar.startSymbol + '" appears on a RHS. New start symbol "' + current.startSymbol + '" introduced.', beforeGrammar: b1, afterGrammar: grammarToString(current), changes: describeChanges(prev, current) }); }
  else { steps.push({ stepTitle: 'Step 1: Add New Start Symbol', description: 'Start symbol does not appear on any RHS. Skipped.', beforeGrammar: b1, afterGrammar: b1, changes: { added: [], removed: [], modified: [] } }); }

  // Step 2
  const b2 = grammarToString(current);
  const p2 = cloneGrammar(current);
  const s2 = removeEpsilonProductions(current);
  if (!s2.skipped) { current = s2.grammar; steps.push({ stepTitle: 'Step 2: Remove \u03B5-Productions', description: 'Nullable variables: {' + [...s2.nullable].join(', ') + '}. For each production containing a nullable variable, all combinations are generated. Epsilon productions removed.', beforeGrammar: b2, afterGrammar: grammarToString(current), changes: describeChanges(p2, current) }); }
  else { steps.push({ stepTitle: 'Step 2: Remove \u03B5-Productions', description: 'No epsilon productions found. Skipped.', beforeGrammar: b2, afterGrammar: b2, changes: { added: [], removed: [], modified: [] } }); }

  // Step 3
  const b3 = grammarToString(current);
  const p3 = cloneGrammar(current);
  const s3 = removeUnitProductions(current);
  if (!s3.skipped) { current = s3.grammar; steps.push({ stepTitle: 'Step 3: Remove Unit Productions', description: 'Unit productions (A \u2192 B) removed. Non-unit productions propagated through unit chains.', beforeGrammar: b3, afterGrammar: grammarToString(current), changes: describeChanges(p3, current) }); }
  else { steps.push({ stepTitle: 'Step 3: Remove Unit Productions', description: 'No unit productions found. Skipped.', beforeGrammar: b3, afterGrammar: b3, changes: { added: [], removed: [], modified: [] } }); }

  // Step 4
  const b4 = grammarToString(current);
  const p4 = cloneGrammar(current);
  const s4 = removeUselessSymbols(current);
  if (!s4.skipped) { current = s4.grammar; steps.push({ stepTitle: 'Step 4: Remove Useless Symbols', description: 'Removed: {' + s4.removedVars.join(', ') + '}. Non-generating or unreachable symbols eliminated.', beforeGrammar: b4, afterGrammar: grammarToString(current), changes: describeChanges(p4, current) }); }
  else { steps.push({ stepTitle: 'Step 4: Remove Useless Symbols', description: 'All symbols are useful. Skipped.', beforeGrammar: b4, afterGrammar: b4, changes: { added: [], removed: [], modified: [] } }); }

  // Step 5
  const b5 = grammarToString(current);
  const p5 = cloneGrammar(current);
  const s5 = replaceTerminals(current);
  if (!s5.skipped) { current = s5.grammar; const m = [...s5.terminalVars.entries()].map(([t, v]) => t + ' \u2192 ' + v).join(', '); steps.push({ stepTitle: 'Step 5: Replace Terminals in Long Productions', description: 'In productions with length \u2265 2, terminals replaced with new variables. Mappings: ' + m, beforeGrammar: b5, afterGrammar: grammarToString(current), changes: describeChanges(p5, current) }); }
  else { steps.push({ stepTitle: 'Step 5: Replace Terminals in Long Productions', description: 'No terminals in productions of length \u2265 2. Skipped.', beforeGrammar: b5, afterGrammar: b5, changes: { added: [], removed: [], modified: [] } }); }

  // Step 6
  const b6 = grammarToString(current);
  const p6 = cloneGrammar(current);
  const s6 = convertToBinary(current);
  if (!s6.skipped) { current = s6.grammar; steps.push({ stepTitle: 'Step 6: Convert to Binary Form', description: 'Productions with more than 2 RHS symbols broken into binary chains using intermediate variables.', beforeGrammar: b6, afterGrammar: grammarToString(current), changes: describeChanges(p6, current) }); }
  else { steps.push({ stepTitle: 'Step 6: Convert to Binary Form', description: 'All productions already have at most 2 symbols. Skipped.', beforeGrammar: b6, afterGrammar: b6, changes: { added: [], removed: [], modified: [] } }); }

  steps.push({ stepTitle: 'Final Result: Chomsky Normal Form', description: 'The grammar is now in CNF. Every production is A \u2192 BC (two variables), A \u2192 a (single terminal), or S \u2192 \u03B5 (only if S not on RHS).', beforeGrammar: grammarToString(grammar), afterGrammar: grammarToString(current), changes: describeChanges(grammar, current) });

  return { steps, result: current };
}
