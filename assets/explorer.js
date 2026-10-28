'use strict';

(() => {
  const groups = {
    'x8/lsm': { name: '8-bit load', style: 'load' },
    'x16/lsm': { name: '16-bit load', style: 'load16' },
    'x8/alu': { name: '8-bit ALU', style: 'alu' },
    'x16/alu': { name: '16-bit ALU', style: 'alu16' },
    'x8/rsb': { name: 'Rotate / bit', style: 'bits' },
    'control/br': { name: 'Branch', style: 'branch' },
    'control/misc': { name: 'Misc', style: 'misc' }
  };
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const hex = number => number.toString(16).padStart(2, '0');
  const operands = op => [op.operand1, op.operand2].filter(value => value !== undefined).join(', ');
  const instruction = op => `${op.mnemonic}${operands(op) ? ` ${operands(op)}` : ''}`;
  const normalize = text => text.toLowerCase().replace(/[\s,]/g, '');
  const state = { data: null, bank: 'unprefixed', group: 'all', query: '', selected: '0x00', unit: 't', view: matchMedia('(max-width: 760px)').matches ? 'list' : 'grid' };
  const style = op => `group-${(groups[op?.group] || groups['control/misc']).style}`;
  const cycles = op => op.cycles.map(value => state.unit === 'm' ? value / 4 : value).join(' / ');
  const address = key => `${state.bank === 'cbprefixed' ? 'CB ' : ''}${key.slice(2).toUpperCase()}`;

  // Shared by the standalone download and the browser's print view.
  const referenceCss = `
    .reference-output{font:12px/1.5 system-ui,sans-serif;color:#18251e;background:white}
    .reference-output h1{font-size:26px;letter-spacing:0;margin:0 0 8px}
    .reference-output h2{font-size:18px;margin:24px 0 8px}
    .reference-output p{margin:6px 0 12px}
    .reference-output table{width:100%;border-collapse:collapse;font-size:11px}
    .reference-output th,.reference-output td{border:1px solid #bbb;padding:5px 7px;text-align:left}
    .reference-output th{background:#edf1e8}
    .reference-output td:nth-child(1),.reference-output td:nth-child(2){font-family:monospace}
    .reference-output thead{display:table-header-group}
    .reference-output tr{break-inside:avoid}
    .reference-output h2{break-after:avoid}
    .reference-output .reference-notes{font-size:11px}
    @page{size:portrait;margin:12mm}
  `;

  function referenceMarkup() {
    const banks = ['unprefixed', 'cbprefixed'];
    const scope = 'All opcodes · both tables';
    return `<h1>Game Boy Opcode Reference</h1><p>${escape(scope)} · ${state.unit.toUpperCase()}-cycles</p>
      <p class="reference-notes">Timing: taken / not taken for conditional instructions. 1 M-cycle = 4 T-cycles.<br>Flags: Z = zero, N = subtract, H = half carry, C = carry. — unchanged; 0 cleared; 1 set; letter depends on result.<br>Source: opcodes.json, values as supplied. Missing addresses are absent from the dataset.</p>` + banks.map(bank => {
      const entries = Object.entries(state.data[bank]);
      const title = bank === 'cbprefixed' ? 'CB prefixed' : 'Base opcodes';
      return `<h2>${title} · ${entries.length} instructions</h2>${entries.length ? `<table><thead><tr><th scope="col">Opcode</th><th scope="col">Instruction</th><th scope="col">Group</th><th scope="col">Bytes</th><th scope="col">${state.unit.toUpperCase()}-cycles</th>${['Z', 'N', 'H', 'C'].map(flag => `<th scope="col">${flag}</th>`).join('')}</tr></thead><tbody>${entries.map(([key, op]) => `<tr><td>${bank === 'cbprefixed' ? 'CB ' : ''}${key.slice(2).toUpperCase()}</td><td>${escape(instruction(op))}</td><td>${escape((groups[op.group] || groups['control/misc']).name)}</td><td>${op.length}</td><td>${escape(cycles(op))}</td>${op.flags.map(flag => `<td>${flag === '-' ? '—' : escape(flag)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p>No matching instructions.</p>'}`;
    }).join('');
  }

  function preparePrint() {
    if (state.data) $('print-reference-content').innerHTML = referenceMarkup();
  }

  function downloadReference() {
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Game Boy Opcode Reference</title><style>${referenceCss}body{margin:24px}.reference-output{max-width:1100px;margin:auto}@media print{body{margin:0}}</style></head><body><main class="reference-output">${referenceMarkup()}</main></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-boy-opcodes-all-${state.unit}-cycles.html`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  const printStyle = document.createElement('style');
  printStyle.textContent = referenceCss;
  document.head.append(printStyle);
  window.addEventListener('beforeprint', preparePrint);

  function matches(key, op) {
    if (!op || (state.group !== 'all' && state.group !== op.group)) return false;
    const query = normalize(state.query);
    if (!query) return true;
    return normalize(instruction(op)).includes(query) || normalize(key).includes(query) || normalize(address(key)).includes(query) || normalize(`0x${address(key).replace(' ', '')}`).includes(query);
  }

  function select(key, updateUrl = true) {
    if (!state.data[state.bank][key]) return;
    state.selected = key;
    document.querySelectorAll('[data-opcode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.opcode === key)));
    renderDetail();
    if (updateUrl) history.replaceState(null, '', `#${state.bank === 'cbprefixed' ? 'cb' : 'base'}-${key.slice(2)}`);
  }

  function renderDetail() {
    const op = state.data[state.bank][state.selected];
    const group = groups[op.group] || groups['control/misc'];
    const bytes = [...(state.bank === 'cbprefixed' ? ['CB'] : []), state.selected.slice(2).toUpperCase()];
    const extra = Math.max(0, op.length - bytes.length);
    const names = ['Zero', 'Subtract', 'Half carry', 'Carry'];
    const flags = ['Z', 'N', 'H', 'C'];
    $('instruction-detail').innerHTML = `
      <div class="detail-address">0x${state.selected.slice(2).toUpperCase()}<span>${state.bank === 'cbprefixed' ? 'CB PREFIXED' : 'BASE TABLE'}</span></div>
      <h2 class="detail-title">${escape(instruction(op))}</h2>
      <div class="detail-group ${style(op)}"><i class="group-dot"></i>${escape(group.name)}</div>
      <div class="metrics"><div class="metric"><small>LENGTH</small><b>${op.length}<span>${op.length === 1 ? 'byte' : 'bytes'}</span></b></div><div class="metric"><small>TIMING</small><b>${cycles(op)}<span>${state.unit === 't' ? 'T' : 'M'}</span></b>${op.cycles.length > 1 ? '<p class="metric-note">Taken / not taken</p>' : ''}</div></div>
      <div class="section-label">FLAGS AFFECTED</div>
      <div class="flag-row">${op.flags.map((value, i) => `<div class="flag ${value !== '-' ? 'active' : ''}" title="${names[i]}: ${value === '-' ? 'unchanged' : value === '0' ? 'cleared' : value === '1' ? 'set' : 'depends on result'}"><small>${flags[i]}</small><b>${value === '-' ? '—' : escape(value)}</b></div>`).join('')}</div>
      <p class="flag-note">— unchanged · 0 cleared · 1 set<br>Letter = depends on the result</p>
      <div class="section-label">INSTRUCTION BYTES</div>
      <div class="byte-row">${bytes.map(byte => `<span class="byte">${byte}</span>`).join('')}${Array.from({ length: extra }, () => '<span class="byte placeholder">??</span>').join('')}</div>
      <p class="encoding-note">${state.bank === 'cbprefixed' ? 'CB prefix + opcode byte.' : 'Opcode byte.'}${extra ? ` Followed by ${extra} operand ${extra === 1 ? 'byte' : 'bytes'}.` : ''}${op.mnemonic === 'PREFIX' ? ' Select CB prefixed to explore the following byte.' : ''}</p>
      ${op.mnemonic === 'PREFIX' ? '<button class="prefix-link" id="follow-prefix">Explore CB table →</button>' : ''}
      <div class="detail-actions"><button id="copy-instruction">Copy instruction</button><button id="copy-link">Copy link ↗</button></div>
      <details><summary>View source JSON</summary><pre>${escape(JSON.stringify(op, null, 2))}</pre></details>
      <p class="source-note">From opcodes.json · values shown as supplied.<br>Timings include instruction fetch.</p>`;
    $('copy-instruction').addEventListener('click', event => copy(instruction(op), event.currentTarget));
    $('copy-link').addEventListener('click', event => copy(location.href, event.currentTarget));
    $('follow-prefix')?.addEventListener('click', () => changeBank('cbprefixed'));
  }

  async function copy(value, button) {
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copied ✓';
    } catch {
      // Browsers without clipboard access still allow copying from a selected field.
      const field = document.createElement('textarea');
      field.value = value;
      button.after(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      button.textContent = copied ? 'Copied ✓' : 'Copy unavailable';
      button.focus();
    }
    setTimeout(() => { if (button.isConnected) button.textContent = original; }, 1800);
  }

  function render() {
    const ops = state.data[state.bank];
    const count = Object.entries(ops).filter(([key, op]) => matches(key, op)).length;
    $('result-count').textContent = `${count} of ${Object.keys(ops).length} instructions`;
    $('bank-label').textContent = state.bank === 'cbprefixed' ? 'CB PREFIXED' : 'BASE OPCODES';
    document.querySelectorAll('[data-bank]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.bank === state.bank)));
    $('filters').innerHTML = `<button class="filter" data-group="all" aria-pressed="${state.group === 'all'}">All groups <small>${Object.keys(ops).length}</small></button>` + Object.entries(groups).map(([key, group]) => {
      const total = Object.values(ops).filter(op => op.group === key).length;
      return `<button class="filter group-${group.style}" data-group="${key}" aria-pressed="${state.group === key}" ${!total ? 'disabled' : ''}><i></i>${group.name}<small>${total}</small></button>`;
    }).join('');
    $('grid-view').setAttribute('aria-pressed', String(state.view === 'grid'));
    $('list-view').setAttribute('aria-pressed', String(state.view === 'list'));
    $('map-scroll').hidden = state.view !== 'grid' || count === 0;
    $('instruction-list').hidden = state.view !== 'list' || count === 0;
    $('empty-state').hidden = count !== 0;

    $('opcode-map').innerHTML = `<thead><tr><th scope="col">HEX</th>${Array.from({ length: 16 }, (_, i) => `<th scope="col">${i.toString(16).toUpperCase()}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: 16 }, (_, row) => `<tr><th scope="row">${row.toString(16).toUpperCase()}</th>${Array.from({ length: 16 }, (_, col) => {
      const key = `0x${hex(row * 16 + col)}`;
      const op = ops[key];
      if (!op) return `<td><span class="opcode-cell missing" title="0x${hex(row * 16 + col).toUpperCase()}: absent from dataset" aria-label="0x${hex(row * 16 + col).toUpperCase()}: absent from dataset">—</span></td>`;
      return `<td><button class="opcode-cell ${style(op)} ${matches(key, op) ? '' : 'dimmed'}" data-opcode="${key}" aria-pressed="${key === state.selected}" aria-label="${escape(`${address(key)}: ${instruction(op)}, ${op.length} bytes, ${cycles(op)} ${state.unit.toUpperCase()}-cycles`)}"><span class="mnemonic">${escape(op.mnemonic)}</span><span class="operands">${escape(operands(op))}</span><span class="cell-meta">${op.length}B · ${cycles(op)}</span></button></td>`;
    }).join('')}</tr>`).join('')}</tbody>`;

    $('instruction-list').innerHTML = '<div class="list-heading"><span>OPCODE</span><span>INSTRUCTION</span><span class="list-group">GROUP</span><span>BYTES</span><span>CYCLES</span></div>' + Object.entries(ops).filter(([key, op]) => matches(key, op)).map(([key, op]) => `<button class="list-item ${style(op)}" data-opcode="${key}" aria-pressed="${key === state.selected}"><span class="list-address">${address(key)}</span><span>${escape(instruction(op))}</span><span class="list-group"><i class="group-dot"></i>${escape((groups[op.group] || groups['control/misc']).name)}</span><span class="list-length">${op.length}B</span><span class="list-timing">${cycles(op)}</span></button>`).join('');
  }

  function changeBank(bank) {
    state.bank = bank;
    state.group = 'all';
    if (!state.data[bank][state.selected]) state.selected = '0x00';
    render();
    select(state.selected);
  }

  function readHash() {
    const match = location.hash.match(/^#(base|cb)-([a-f0-9]{2})$/i);
    if (!match) return false;
    const bank = match[1].toLowerCase() === 'cb' ? 'cbprefixed' : 'unprefixed';
    const key = `0x${match[2].toLowerCase()}`;
    if (!state.data[bank][key]) return false;
    state.bank = bank;
    state.selected = key;
    state.group = 'all';
    return true;
  }

  async function init() {
    try {
      const response = await fetch('opcodes.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data = await response.json();
      $('total-count').textContent = Object.values(state.data).reduce((sum, bank) => sum + Object.keys(bank).length, 0);
      readHash();
      render();
      select(state.selected, false);
      $('download-reference').removeAttribute('aria-disabled');
      $('print-reference').disabled = false;
    } catch (error) {
      $('result-count').textContent = 'Could not load opcode data';
      $('instruction-detail').innerHTML = '<h2>Data unavailable</h2><p class="encoding-note">Serve this directory with a web server so the viewer can load opcodes.json. Check the connection and reload to try again.</p><a href="opcodes.json">Open the JSON data ↗</a>';
      console.error('Unable to load opcodes.json:', error);
      return;
    }

    document.querySelectorAll('[data-bank]').forEach(button => button.addEventListener('click', () => changeBank(button.dataset.bank)));
    $('print-reference').addEventListener('click', () => { preparePrint(); window.print(); });
    $('filters').addEventListener('click', event => {
      const button = event.target.closest('[data-group]');
      if (!button || button.disabled) return;
      state.group = button.dataset.group;
      render();
    });
    $('search').addEventListener('input', event => { state.query = event.target.value; render(); });
    $('reset-filters').addEventListener('click', () => { state.query = ''; state.group = 'all'; $('search').value = ''; render(); $('search').focus(); });
    $('cycle-unit').addEventListener('change', event => { state.unit = event.target.value; render(); renderDetail(); });
    for (const view of ['grid', 'list']) $(view + '-view').addEventListener('click', () => { state.view = view; render(); });
    for (const id of ['opcode-map', 'instruction-list']) $(id).addEventListener('click', event => {
      const button = event.target.closest('[data-opcode]');
      if (button) select(button.dataset.opcode);
    });
    $('opcode-map').addEventListener('keydown', event => {
      const button = event.target.closest('[data-opcode]');
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -16, ArrowDown: 16 }[event.key];
      if (!button || !delta) return;
      event.preventDefault();
      let next = parseInt(button.dataset.opcode, 16) + delta;
      while (next >= 0 && next < 256) {
        const target = $('opcode-map').querySelector(`[data-opcode="0x${hex(next)}"]`);
        if (target) { target.focus(); select(target.dataset.opcode); break; }
        next += delta;
      }
    });
    window.addEventListener('hashchange', () => { if (readHash()) { render(); select(state.selected, false); } });
  }

  $('download-reference').addEventListener('click', event => {
    event.preventDefault();
    if (state.data) downloadReference();
  });
  $('help-open').addEventListener('click', () => $('help-dialog').showModal());
  $('help-close').addEventListener('click', () => $('help-dialog').close());
  $('help-dialog').addEventListener('click', event => { if (event.target === $('help-dialog') && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > event.target.clientWidth || event.offsetY > event.target.clientHeight)) $('help-dialog').close(); });
  document.addEventListener('keydown', event => {
    const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (event.key === '/' && !editing && !$('help-dialog').open) { event.preventDefault(); $('search').focus(); }
    if (event.key === 'Escape' && !$('help-dialog').open && state.query) { state.query = ''; $('search').value = ''; if (state.data) render(); }
  });
  init();
})();
