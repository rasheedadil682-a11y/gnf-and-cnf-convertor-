/**
 * grammarParser.js - Parse, validate, serialize context-free grammars
 */

export const EPSILON = '\u03B5';

export function isVariable(sym) {
  return /^[A-Z]/.test(sym);
}

export function isTerminal(sym) {
  return sym !== EPSILON && !isVariable(sym) && sym.length > 0;
}

function tokenizeBody(bodyStr) {
  const tokens = [];
  let i = 0;
  while (i < bodyStr.length) {
    const ch = bodyStr[i];
    if (ch === ' ') { i++; continue; }
    if (ch === EPSILON || ch === '\u03B5' || ch === '\u03F5') {
      return [];
    }
    if (/[A-Z]/.test(ch)) {
      let tok = ch;
      i++;
      while (i < bodyStr.length && (/[0-9']/.test(bodyStr[i]) || bodyStr[i] === '\u2032' || bodyStr[i] === '\u2019')) {
        tok += bodyStr[i];
        i++;
      }
      tokens.push(tok);
    } else {
      tokens.push(ch);
      i++;
    }
  }
  return tokens;
}

export function parseGrammar(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//'));
  if (lines.length === 0) throw new Error('Empty grammar');

  const variables = new Set();
  const terminals = new Set();
  const productions = new Map();
  let startSymbol = null;

  for (const line of lines) {
    const parts = line.split(/\s*(?:\u2192|->|:)\s*/);
    if (parts.length < 2) throw new Error('Invalid production: "' + line + '"');

    const lhs = parts[0].trim();
    if (!isVariable(lhs)) throw new Error('LHS must be a non-terminal (uppercase): "' + lhs + '"');

    if (startSymbol === null) startSymbol = lhs;
    variables.add(lhs);

    const rhsList = parts[1].split(/\s*\|\s*/);
    const bodies = [];

    for (const rhs of rhsList) {
      const trimmed = rhs.trim();
      if (trimmed === '' || trimmed === EPSILON || trimmed === '\u03B5' || trimmed === '\u03F5' || trimmed === 'epsilon') {
        bodies.push([]);
      } else {
        bodies.push(tokenizeBody(trimmed));
      }
    }

    if (productions.has(lhs)) {
      productions.get(lhs).push(...bodies);
    } else {
      productions.set(lhs, bodies);
    }
  }

  for (const [, bodies] of productions) {
    for (const body of bodies) {
      for (const sym of body) {
        if (!isVariable(sym)) terminals.add(sym);
      }
    }
  }
  for (const [, bodies] of productions) {
    for (const body of bodies) {
      for (const sym of body) {
        if (isVariable(sym)) variables.add(sym);
      }
    }
  }

  return { variables: new Set(variables), terminals: new Set(terminals), productions, startSymbol };
}

export function grammarToString(grammar) {
  const lines = [];
  const ordered = [grammar.startSymbol, ...[...grammar.productions.keys()].filter(v => v !== grammar.startSymbol)];
  for (const v of ordered) {
    if (!grammar.productions.has(v)) continue;
    const bodies = grammar.productions.get(v);
    const bodyStrs = bodies.map(b => b.length === 0 ? EPSILON : b.join(''));
    lines.push(v + ' \u2192 ' + bodyStrs.join(' | '));
  }
  return lines.join('\n');
}

export function cloneGrammar(g) {
  const newProductions = new Map();
  for (const [k, v] of g.productions) {
    newProductions.set(k, v.map(body => [...body]));
  }
  return {
    variables: new Set(g.variables),
    terminals: new Set(g.terminals),
    productions: newProductions,
    startSymbol: g.startSymbol,
  };
}

export function validateGrammar(grammar) {
  const errors = [];
  if (!grammar.startSymbol) errors.push('No start symbol defined');
  if (grammar.variables.size === 0) errors.push('No variables (non-terminals) found');
  if (grammar.terminals.size === 0) errors.push('No terminals found');
  for (const [v, bodies] of grammar.productions) {
    if (bodies.length === 0) errors.push('Variable ' + v + ' has no productions');
  }
  for (const [, bodies] of grammar.productions) {
    for (const body of bodies) {
      for (const sym of body) {
        if (isVariable(sym) && !grammar.productions.has(sym)) {
          errors.push('Variable ' + sym + ' is used but has no productions');
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function isCNF(grammar) {
  for (const [v, bodies] of grammar.productions) {
    for (const body of bodies) {
      if (body.length === 0) {
        if (v !== grammar.startSymbol) return false;
      } else if (body.length === 1) {
        if (!isTerminal(body[0])) return false;
      } else if (body.length === 2) {
        if (!isVariable(body[0]) || !isVariable(body[1])) return false;
      } else {
        return false;
      }
    }
  }
  return true;
}

export function isGNF(grammar) {
  for (const [v, bodies] of grammar.productions) {
    for (const body of bodies) {
      if (body.length === 0) {
        if (v !== grammar.startSymbol) return false;
      } else {
        if (!isTerminal(body[0])) return false;
        for (let i = 1; i < body.length; i++) {
          if (!isVariable(body[i])) return false;
        }
      }
    }
  }
  return true;
}

export function freshVariable(existingVars, prefix) {
  prefix = prefix || 'T';
  let candidate = prefix;
  let idx = 1;
  while (existingVars.has(candidate)) {
    candidate = prefix + idx;
    idx++;
  }
  return candidate;
}

export const SAMPLE_GRAMMARS = {
  'Simple CFG': {
    type: 'CFG',
    text: 'S \u2192 AB | a\nA \u2192 BC | a\nB \u2192 b | \u03B5\nC \u2192 c',
    description: 'A simple CFG with epsilon productions.'
  },
  'Arithmetic Expressions': {
    type: 'CFG',
    text: 'E \u2192 E + T | T\nT \u2192 T * F | F\nF \u2192 ( E ) | a',
    description: 'Classic expression grammar with left recursion.'
  },
  'Balanced Parentheses': {
    type: 'CFG',
    text: 'S \u2192 ( S ) S | \u03B5',
    description: 'Generates all strings of balanced parentheses.'
  },
  'Palindromes': {
    type: 'CFG',
    text: 'S \u2192 a S a | b S b | a | b | \u03B5',
    description: 'Generates palindromes over {a, b}.'
  },
  'Simple CNF': {
    type: 'CNF',
    text: 'S \u2192 AB | a\nA \u2192 BC | b\nB \u2192 a\nC \u2192 b',
    description: 'A grammar already in Chomsky Normal Form.'
  },
  'Simple GNF': {
    type: 'GNF',
    text: 'S \u2192 a A B | b\nA \u2192 a A | a\nB \u2192 b B | b',
    description: 'A grammar already in Greibach Normal Form.'
  },
  'Unit Productions': {
    type: 'CFG',
    text: 'S \u2192 A\nA \u2192 B\nB \u2192 a b | b',
    description: 'CFG with chain of unit productions.'
  },
  'Left Recursive': {
    type: 'CFG',
    text: 'S \u2192 S a | S b | c | d',
    description: 'CFG with direct left recursion.'
  },
};
