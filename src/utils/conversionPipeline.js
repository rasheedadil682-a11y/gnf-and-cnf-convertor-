/**
 * conversionPipeline.js - Routes all conversion paths
 */
import { parseGrammar, grammarToString, isCNF, isGNF, cloneGrammar, EPSILON } from './grammarParser.js';
import { convertToCNF } from './cnfConverter.js';
import { convertToGNF } from './gnfConverter.js';

function describeChanges(before, after) {
  const changes = { added: [], removed: [], modified: [] };
  const bProds = new Map();
  for (const [v, bodies] of before.productions) bProds.set(v, bodies.map(b => b.join('')));
  const aProds = new Map();
  for (const [v, bodies] of after.productions) aProds.set(v, bodies.map(b => b.join('')));
  for (const [v, bodyStrs] of aProds) { if (!bProds.has(v)) { changes.added.push(...bodyStrs.map(b => v+' \u2192 '+(b||EPSILON))); } else { const old = new Set(bProds.get(v)); for (const b of bodyStrs) { if (!old.has(b)) changes.added.push(v+' \u2192 '+(b||EPSILON)); } } }
  for (const [v, bodyStrs] of bProds) { if (!aProds.has(v)) { changes.removed.push(...bodyStrs.map(b => v+' \u2192 '+(b||EPSILON))); } else { const cur = new Set(aProds.get(v)); for (const b of bodyStrs) { if (!cur.has(b)) changes.removed.push(v+' \u2192 '+(b||EPSILON)); } } }
  return changes;
}

function cnfToCFG(grammar) {
  const steps = [];
  const g = cloneGrammar(grammar);
  const text = grammarToString(g);
  const empty = { added: [], removed: [], modified: [] };
  steps.push({ stepTitle: 'Input: Chomsky Normal Form Grammar', description: 'This grammar is in CNF.', beforeGrammar: text, afterGrammar: text, changes: empty });
  steps.push({ stepTitle: 'Step 1: Understanding CNF Restrictions', description: 'In CNF, every production is one of:\n\u2022 A \u2192 BC (exactly two non-terminals)\n\u2022 A \u2192 a (exactly one terminal)\n\u2022 S \u2192 \u03B5 (only if S not on any RHS)\n\nSince every CNF grammar is already a valid CFG, the conversion is about understanding.', beforeGrammar: text, afterGrammar: text, changes: empty });
  const cats = { binary: [], terminal: [], epsilon: [] };
  for (const [v, bodies] of g.productions) { for (const body of bodies) { const str = v+' \u2192 '+(body.length===0?EPSILON:body.join('')); if (body.length===0) cats.epsilon.push(str); else if (body.length===1) cats.terminal.push(str); else cats.binary.push(str); } }
  let catDesc = '';
  if (cats.binary.length>0) catDesc+='Binary (A \u2192 BC): '+cats.binary.join(', ')+'\n';
  if (cats.terminal.length>0) catDesc+='Terminal (A \u2192 a): '+cats.terminal.join(', ')+'\n';
  if (cats.epsilon.length>0) catDesc+='Epsilon (S \u2192 \u03B5): '+cats.epsilon.join(', ');
  steps.push({ stepTitle: 'Step 2: Production Categories', description: catDesc, beforeGrammar: text, afterGrammar: text, changes: empty });
  steps.push({ stepTitle: 'Result: Equivalent CFG', description: 'CNF is a subset of CFG. This grammar is already a valid Context-Free Grammar. No modifications needed.', beforeGrammar: text, afterGrammar: text, changes: empty });
  return { steps, result: g };
}

function gnfToCFG(grammar) {
  const steps = [];
  const g = cloneGrammar(grammar);
  const text = grammarToString(g);
  const empty = { added: [], removed: [], modified: [] };
  steps.push({ stepTitle: 'Input: Greibach Normal Form Grammar', description: 'This grammar is in GNF.', beforeGrammar: text, afterGrammar: text, changes: empty });
  steps.push({ stepTitle: 'Step 1: Understanding GNF Restrictions', description: 'In GNF, every production has the form:\n\u2022 A \u2192 a \u03B1  where a is a terminal and \u03B1 is a (possibly empty) string of variables\n\u2022 S \u2192 \u03B5 (only if S not on any RHS)\n\nKey properties:\n\u2022 No left recursion possible\n\u2022 Each derivation step consumes exactly one terminal\n\u2022 Suitable for top-down parsing', beforeGrammar: text, afterGrammar: text, changes: empty });
  let analysis = 'Production analysis:\n';
  for (const [v, bodies] of g.productions) { for (const body of bodies) { if (body.length===0) { analysis+='\u2022 '+v+' \u2192 \u03B5 : Epsilon production\n'; } else { analysis+='\u2022 '+v+' \u2192 '+body.join('')+' : Leading terminal "'+body[0]+'"'; if (body.length>1) analysis+=', followed by variables '+body.slice(1).join(', '); analysis+='\n'; } } }
  steps.push({ stepTitle: 'Step 2: Analyzing GNF Structure', description: analysis, beforeGrammar: text, afterGrammar: text, changes: empty });
  steps.push({ stepTitle: 'Result: Equivalent CFG', description: 'GNF is a subset of CFG. This grammar is already a valid Context-Free Grammar. No modifications needed.', beforeGrammar: text, afterGrammar: text, changes: empty });
  return { steps, result: g };
}

function gnfToCNF(grammar) {
  const allSteps = [];
  const g = cloneGrammar(grammar);
  const text = grammarToString(g);
  const empty = { added: [], removed: [], modified: [] };
  allSteps.push({ stepTitle: 'Input: GNF Grammar', description: 'Converting GNF \u2192 CNF in two phases:\n\nPhase 1: GNF \u2192 CFG (recognize GNF is already a CFG)\nPhase 2: CFG \u2192 CNF (apply standard CNF conversion)', beforeGrammar: text, afterGrammar: text, changes: empty });
  allSteps.push({ stepTitle: '\u2550\u2550\u2550 Phase 1: GNF \u2192 CFG \u2550\u2550\u2550', description: 'GNF is a restricted form of CFG. Every GNF grammar is already a valid CFG. We proceed directly to CNF conversion.', beforeGrammar: text, afterGrammar: text, changes: empty });
  const cnfResult = convertToCNF(g);
  allSteps.push({ stepTitle: '\u2550\u2550\u2550 Phase 2: CFG \u2192 CNF \u2550\u2550\u2550', description: 'Now applying the standard Chomsky Normal Form conversion.', beforeGrammar: text, afterGrammar: text, changes: empty });
  for (let i = 1; i < cnfResult.steps.length; i++) allSteps.push(cnfResult.steps[i]);
  return { steps: allSteps, result: cnfResult.result };
}

export function runConversion(grammarText, inputType, targetType) {
  const grammar = parseGrammar(grammarText);
  if (inputType === 'CNF' && !isCNF(grammar)) console.warn('Grammar claimed to be CNF but does not satisfy CNF constraints. Treating as CFG.');
  if (inputType === 'GNF' && !isGNF(grammar)) console.warn('Grammar claimed to be GNF but does not satisfy GNF constraints. Treating as CFG.');

  if (inputType === targetType) {
    return { steps: [{ stepTitle: 'No Conversion Needed', description: 'The input is already in '+targetType+' form.', beforeGrammar: grammarToString(grammar), afterGrammar: grammarToString(grammar), changes: { added: [], removed: [], modified: [] } }], result: grammar };
  }

  const key = inputType+'\u2192'+targetType;
  switch (key) {
    case 'CFG\u2192CNF': return convertToCNF(grammar);
    case 'CFG\u2192GNF': return convertToGNF(grammar);
    case 'CNF\u2192CFG': return cnfToCFG(grammar);
    case 'GNF\u2192CFG': return gnfToCFG(grammar);
    case 'GNF\u2192CNF': return gnfToCNF(grammar);
    case 'CNF\u2192GNF': {
      const allSteps = [];
      const text = grammarToString(grammar);
      const empty = { added: [], removed: [], modified: [] };
      allSteps.push({ stepTitle: 'CNF \u2192 GNF Conversion', description: 'CNF is a restricted CFG. We first recognize it as CFG, then apply CFG \u2192 GNF.', beforeGrammar: text, afterGrammar: text, changes: empty });
      allSteps.push({ stepTitle: '\u2550\u2550\u2550 Phase 1: CNF \u2192 CFG \u2550\u2550\u2550', description: 'CNF is already a valid CFG. Proceeding to GNF conversion.', beforeGrammar: text, afterGrammar: text, changes: empty });
      allSteps.push({ stepTitle: '\u2550\u2550\u2550 Phase 2: CFG \u2192 GNF \u2550\u2550\u2550', description: 'Applying Greibach Normal Form conversion.', beforeGrammar: text, afterGrammar: text, changes: empty });
      const gnfResult = convertToGNF(grammar);
      for (let i = 1; i < gnfResult.steps.length; i++) allSteps.push(gnfResult.steps[i]);
      return { steps: allSteps, result: gnfResult.result };
    }
    default: throw new Error('Unsupported conversion: '+inputType+' \u2192 '+targetType);
  }
}

export const THEORY = {
  CFG: {
    title: 'Context-Free Grammar (CFG)',
    content: 'A Context-Free Grammar is a formal grammar where every production rule has the form:\n\n  A \u2192 \u03B1\n\nwhere A is a single non-terminal and \u03B1 is a string of terminals and/or non-terminals.\n\nComponents:\n\u2022 Variables (V): Non-terminal symbols (uppercase letters)\n\u2022 Terminals (\u03A3): Terminal symbols (lowercase letters)\n\u2022 Productions (P): Rules A \u2192 \u03B1\n\u2022 Start Symbol (S): A designated variable\n\nProperties:\n\u2022 Generates Context-Free Languages (CFL)\n\u2022 Recognized by Pushdown Automata\n\u2022 Closed under union, concatenation, Kleene star\n\u2022 NOT closed under intersection or complement',
    beginner: 'Think of a CFG as a recipe for building strings.\n\nYou start with "S" and keep replacing symbols using rules until only lowercase letters remain.\n\nExample:\nS \u2192 aB means "replace S with aB"\nB \u2192 b means "replace B with b"\n\nSo: S \u2192 aB \u2192 ab \u2713'
  },
  CNF: {
    title: 'Chomsky Normal Form (CNF)',
    content: 'CNF is a restricted CFG form where every production is one of:\n\n  A \u2192 BC    (exactly two non-terminals)\n  A \u2192 a     (exactly one terminal)\n  S \u2192 \u03B5     (only if S not on RHS)\n\nWhy CNF?\n\u2022 Enables CYK parsing algorithm\n\u2022 Every derivation has exactly 2n-1 steps\n\u2022 Binary tree structure for parse trees\n\u2022 Simplifies many theoretical proofs',
    beginner: 'CNF is a "clean" version of grammar rules with only two allowed formats:\n\n1. A \u2192 BC : A variable becomes exactly TWO variables\n2. A \u2192 a : A variable becomes exactly ONE letter\n\nThis makes it easy for computers to check strings efficiently!'
  },
  GNF: {
    title: 'Greibach Normal Form (GNF)',
    content: 'GNF is a restricted CFG form where every production has the form:\n\n  A \u2192 a \u03B1    (terminal + zero or more variables)\n  S \u2192 \u03B5      (only if S not on RHS)\n\nWhy GNF?\n\u2022 No left recursion possible\n\u2022 Suitable for LL / top-down parsing\n\u2022 Each step consumes exactly one input symbol\n\u2022 Easy conversion to Pushdown Automata',
    beginner: 'GNF rules always start with a lowercase letter, followed by zero or more uppercase letters:\n\n  A \u2192 aBC  \u2713 (starts with terminal)\n  A \u2192 a    \u2713 (just a terminal)\n  A \u2192 BC   \u2717 (starts with variable!)\n\nThis makes parsing straightforward \u2014 each rule "eats" exactly one letter.'
  },
  conversions: {
    title: 'Why Convert Between Forms?',
    content: 'Different normal forms serve different purposes:\n\nCFG \u2192 CNF: Used for CYK parsing and theoretical proofs.\nCFG \u2192 GNF: Used for constructing PDAs and top-down parsing.\nGNF \u2192 CNF: When you need CYK parsing from a GNF grammar.\nCNF/GNF \u2192 CFG: Understanding the relationship between forms.',
    beginner: 'Each form is better at different things!\n\n\u2022 CNF is great for checking strings (table method)\n\u2022 GNF is great for building parsers (reads left to right)\n\u2022 CFG is the general form (easy to write)\n\nConverting between them lets us use the right tool!'
  }
};
