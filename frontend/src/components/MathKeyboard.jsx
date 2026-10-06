import React, { useEffect, useState } from 'react';
import { Keyboard, Delete, ArrowLeft, ArrowRight, Eraser } from 'lucide-react';

const KEY_GROUPS = [
  {
    title: 'Calculus',
    cols: 3,
    keys: [
      { label: 'd/dx', tpl: 'diff(|, x)', hint: 'Derivative: diff(f, x)' },
      { label: 'd²/dx²', tpl: 'diff(|, x, 2)', hint: 'Second derivative: diff(f, x, 2)' },
      { label: '∫ dx', tpl: 'integrate(|, x)', hint: 'Indefinite integral: integrate(f, x)' },
      { label: '∫ₐᵗ', tpl: 'integrate(|, (t, 0, x))', hint: 'Definite integral from 0 to x: integrate(f(t), (t, 0, x))' },
      { label: 'Σ', tpl: 'summation(|, (k, 1, 10))', hint: 'Sum: summation(f(k), (k, 1, 10))' },
      { label: 'lim', tpl: 'limit(|, x, 0)', hint: 'Limit: limit(f, x, 0)' },
    ],
  },
  {
    title: 'Roots & powers',
    cols: 4,
    keys: [
      { label: '√', tpl: 'sqrt(|)', hint: 'Square root' },
      { label: '∛', tpl: 'cbrt(|)', hint: 'Cube root' },
      { label: 'ⁿ√', tpl: 'root(|, 4)', hint: 'n-th root: root(x, n)' },
      { label: '|x|', tpl: 'abs(|)', hint: 'Absolute value' },
      { label: 'x²', tpl: '^2', hint: 'Square' },
      { label: 'x³', tpl: '^3', hint: 'Cube' },
      { label: 'xⁿ', tpl: '^(|)', hint: 'Power' },
      { label: '1/x', tpl: '1/(|)', hint: 'Reciprocal' },
      { label: 'eˣ', tpl: 'exp(|)', hint: 'Exponential' },
      { label: 'ln', tpl: 'ln(|)', hint: 'Natural logarithm' },
      { label: 'log₁₀', tpl: 'log10(|)', hint: 'Base-10 logarithm' },
      { label: 'log₂', tpl: 'log2(|)', hint: 'Base-2 logarithm' },
    ],
  },
  {
    title: 'Trigonometry',
    cols: 4,
    keys: [
      { label: 'sin', tpl: 'sin(|)' },
      { label: 'cos', tpl: 'cos(|)' },
      { label: 'tan', tpl: 'tan(|)' },
      { label: 'sec', tpl: 'sec(|)' },
      { label: 'sin⁻¹', tpl: 'asin(|)', hint: 'Inverse sine' },
      { label: 'cos⁻¹', tpl: 'acos(|)', hint: 'Inverse cosine' },
      { label: 'tan⁻¹', tpl: 'atan(|)', hint: 'Inverse tangent' },
      { label: 'csc', tpl: 'csc(|)' },
      { label: 'sinh', tpl: 'sinh(|)' },
      { label: 'cosh', tpl: 'cosh(|)' },
      { label: 'tanh', tpl: 'tanh(|)' },
      { label: 'cot', tpl: 'cot(|)' },
    ],
  },
  {
    title: 'Variables & constants',
    cols: 7,
    keys: [
      { label: 'x', tpl: 'x' },
      { label: 'y', tpl: 'y', hint: 'Only used by ODE and Poisson (g(x, y)) inputs' },
      { label: 'π', tpl: 'pi', hint: 'pi' },
      { label: 'e', tpl: 'e', hint: "Euler's number" },
      { label: '(', tpl: '(' },
      { label: ')', tpl: ')' },
      { label: ',', tpl: ', ' },
    ],
  },
];

const PAD_KEYS = [
  '7', '8', '9', '/',
  '4', '5', '6', '*',
  '1', '2', '3', '-',
  '0', '.', '^', '+',
];

function setInputValue(input, value, caret) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
  if (caret !== undefined && caret !== null) {
    input.setSelectionRange(caret, caret);
  }
}

function insertAtCursor(input, text) {
  input.focus();
  const cursorMarker = text.indexOf('|');
  const insert = cursorMarker === -1 ? text : text.replace('|', '');
  
  if (document.execCommand('insertText', false, insert)) {
    if (cursorMarker !== -1) {
      const newPos = input.selectionEnd - (insert.length - cursorMarker);
      input.setSelectionRange(newPos, newPos);
    }
  } else {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const next = input.value.slice(0, start) + insert + input.value.slice(end);
    setInputValue(input, next, start + (cursorMarker === -1 ? insert.length : cursorMarker));
  }
}

function backspace(input) {
  input.focus();
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? start;
  if (start !== end) {
    if (!document.execCommand('delete')) {
      setInputValue(input, input.value.slice(0, start) + input.value.slice(end), start);
    }
    return;
  }
  if (start === 0) return;
  input.setSelectionRange(start - 1, start);
  if (!document.execCommand('delete')) {
    setInputValue(input, input.value.slice(0, start - 1) + input.value.slice(end), start - 1);
  }
}

function moveCursor(input, delta) {
  const pos = Math.min(Math.max((input.selectionStart ?? 0) + delta, 0), input.value.length);
  input.focus();
  input.setSelectionRange(pos, pos);
}

export default function MathKeyboard() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const onFocusIn = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.dataset.expr) {
        setTarget(e.target);
      }
    };
    const onMouseDown = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.dataset.expr) {
        setTarget(e.target);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const activeTarget = target && target.isConnected ? target : null;

  const getEffectiveTarget = () => {
    if (activeTarget) return activeTarget;
    const firstInput = document.querySelector('input[data-expr]');
    if (firstInput) {
      setTarget(firstInput);
      return firstInput;
    }
    return null;
  };

  const run = (action) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const t = getEffectiveTarget();
    if (t) action(t);
  };

  const keepFocus = (e) => {
    e.preventDefault();
  };

  return (
    <div className="enterprise-card math-keyboard" style={{ userSelect: 'none' }}>
      <div className="math-keyboard-header" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-bright)', fontWeight: '700' }}>
        <Keyboard size={18} color="var(--sky-blue)" />
        <span style={{ color: 'var(--text-main)' }}>Math Keyboard</span>
      </div>
      
      <div style={{ padding: '12px 16px', background: activeTarget ? 'rgba(205, 155, 240, 0.1)' : '#f8fafc', fontSize: '13px', color: activeTarget ? 'var(--indigo-accent)' : 'var(--text-muted)' }}>
        {activeTarget
          ? <>Typing into <strong className="font-mono">{activeTarget.dataset.expr}</strong></>
          : 'Click a function field (f(x), g(x), …) to type into it.'}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button type="button" className="btn-enterprise-outline" style={{ flex: 1, padding: '8px' }} title="Move cursor left" onMouseDown={keepFocus} onClick={run((i) => moveCursor(i, -1))}><ArrowLeft size={16} /></button>
          <button type="button" className="btn-enterprise-outline" style={{ flex: 1, padding: '8px' }} title="Move cursor right" onMouseDown={keepFocus} onClick={run((i) => moveCursor(i, 1))}><ArrowRight size={16} /></button>
          <button type="button" className="btn-enterprise-outline" style={{ flex: 1, padding: '8px', color: 'var(--rose-accent)', borderColor: '#fca5a5' }} title="Backspace" onMouseDown={keepFocus} onClick={run(backspace)}><Delete size={16} /></button>
          <button type="button" className="btn-enterprise-outline" style={{ flex: 1, padding: '8px' }} title="Clear field" onMouseDown={keepFocus} onClick={run((i) => setInputValue(i, '', 0))}><Eraser size={16} /></button>
        </div>

        {KEY_GROUPS.map((group) => (
          <div key={group.title}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{group.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.cols}, 1fr)`, gap: '6px' }}>
              {group.keys.map((k) => (
                <button
                  key={k.label}
                  type="button"
                  className="btn-enterprise-outline"
                  style={{ padding: '8px 4px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                  title={k.hint || k.tpl.replace('|', '')}
                  onMouseDown={keepFocus}
                  onClick={run((i) => insertAtCursor(i, k.tpl))}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Numbers & operators</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {PAD_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className="btn-enterprise-outline"
                style={{ padding: '12px 4px', fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '700', background: '#f8fafc' }}
                onMouseDown={keepFocus}
                onClick={run((i) => insertAtCursor(i, k))}
              >
                {{ '*': '×', '/': '÷', '-': '−' }[k] || k}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
