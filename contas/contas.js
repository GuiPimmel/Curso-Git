/* Motor de contas: gera o "passo a passo" de cada operação, do jeito que se
   aprende na escola (conta armada e método da chave). Não depende do DOM. */
'use strict';

const CASAS = ['unidades', 'dezenas', 'centenas', 'unidades de milhar',
  'dezenas de milhar', 'centenas de milhar', 'unidades de milhão'];
const casa = i => CASAS[i] || `${i + 1}ª casa`;
const digitos = s => s.split('').reverse().map(Number); // índice 0 = unidades
const cel = (t = '', cls = '') => ({ t: String(t), cls });
const vazias = n => Array.from({ length: n }, () => cel());

function linhaNumero(s, largura, cls = '') {
  const cells = vazias(largura);
  for (let i = 0; i < s.length; i++) cells[largura - s.length + i] = cel(s[i], cls);
  return cells;
}

function desenhar(linhas, destaque = []) {
  let h = '<table class="grade">';
  for (const l of linhas) {
    h += `<tr class="${l.cls || ''}">`;
    l.cells.forEach((c, j) => {
      const hl = destaque.includes(j) ? ' hl' : '';
      h += `<td class="${c.cls}${hl}">${c.t}</td>`;
    });
    h += '</tr>';
  }
  return h + '</table>';
}

/* ---------- Adição ---------- */
function resolverSoma(a, b) {
  const A = String(a), B = String(b), R = String(a + b);
  const W = Math.max(A.length, B.length, R.length);
  const n = Math.max(A.length, B.length);
  const da = digitos(A), db = digitos(B);
  const res = [], vai = [], passos = [];
  const col = i => W - i;
  const ver = hl => {
    const v = vazias(W + 1); vai.forEach((x, i) => { if (x) v[col(i)] = cel(x, 'vai'); });
    const r = vazias(W + 1); res.forEach((x, i) => { r[col(i)] = cel(x, 'res'); });
    return desenhar([
      { cells: v, cls: 'linha-vai' },
      { cells: [cel(), ...linhaNumero(A, W)] },
      { cells: [cel('+', 'op'), ...linhaNumero(B, W)], cls: 'traco' },
      { cells: r },
    ], hl == null ? [] : [col(hl)]);
  };

  passos.push({ texto: `Primeiro <b>armamos a conta</b>: ${A} em cima e ${B} embaixo, com unidade embaixo de unidade, dezena embaixo de dezena. Sempre começamos pela <b>direita</b>!`, html: ver(null) });
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const termos = [];
    if (i < A.length) termos.push(da[i]);
    if (i < B.length) termos.push(db[i]);
    const s = termos.reduce((x, y) => x + y, 0) + carry;
    let t = `Coluna das <b>${casa(i)}</b>: `;
    const partes = termos.map(String);
    if (carry) partes.push(`${carry} <small>(do "vai ${carry}")</small>`);
    t += partes.length > 1 ? `${partes.join(' + ')} = <b>${s}</b>. ` : `só temos o ${partes[0]}. `;
    res[i] = s % 10;
    const nc = Math.floor(s / 10);
    if (nc) { vai[i + 1] = nc; t += `Passou de 9! Escrevemos <b>${s % 10}</b> e <b>vai ${nc}</b> para a coluna das ${casa(i + 1)}.`; }
    else t += `Escrevemos <b>${s}</b> embaixo.`;
    carry = nc;
    passos.push({ texto: t, html: ver(i) });
  }
  if (carry) {
    res[n] = carry;
    passos.push({ texto: `Acabaram os números, mas ainda tem o "vai ${carry}". Ele desce direto para o resultado.`, html: ver(n) });
  }
  passos.push({ texto: `Pronto! <b>${A} + ${B} = ${R}</b> 🎉`, html: ver(null), fim: true });
  return { passos, resultado: R };
}

/* ---------- Subtração ---------- */
function resolverSubtracao(a, b) {
  if (a < b) return { erro: 'Na subtração, o primeiro número precisa ser maior ou igual ao segundo. (Números negativos ficam para mais tarde!)' };
  const A = String(a), B = String(b), R = String(a - b);
  const W = A.length;
  const orig = digitos(A), cur = orig.slice(), db = digitos(B);
  const res = [], mudou = new Set(), passos = [];
  const col = i => W - i;
  const ver = (hl, final) => {
    const top = vazias(W + 1); mudou.forEach(i => { top[col(i)] = cel(cur[i], 'vai'); });
    const lA = [cel(), ...linhaNumero(A, W)];
    mudou.forEach(i => { lA[col(i)].cls = 'riscado'; });
    const r = vazias(W + 1);
    if (final) linhaNumero(R, W, 'res').forEach((c, j) => { r[j + 1] = c; });
    else res.forEach((x, i) => { r[col(i)] = cel(x, 'res'); });
    return desenhar([
      { cells: top, cls: 'linha-vai' },
      { cells: lA },
      { cells: [cel('−', 'op'), ...linhaNumero(B, W)], cls: 'traco' },
      { cells: r },
    ], hl == null ? [] : [col(hl)]);
  };

  passos.push({ texto: `Primeiro <b>armamos a conta</b>: o maior (${A}) em cima e o ${B} embaixo, unidade embaixo de unidade. Começamos pela <b>direita</b>!`, html: ver(null) });
  for (let i = 0; i < W; i++) {
    const temB = i < B.length;
    const y = temB ? db[i] : 0;
    if (cur[i] < y) {
      let j = i + 1;
      while (cur[j] === 0) j++;
      let t;
      if (j === i + 1) {
        t = `Coluna das <b>${casa(i)}</b>: ${cur[i]} é menor que ${y}, não dá para tirar! Pedimos <b>emprestado</b> 1 da coluna das ${casa(j)}: o ${cur[j]} vira <b>${cur[j] - 1}</b> e o ${cur[i]} vira <b>${cur[i] + 10}</b>.`;
      } else {
        t = `Coluna das <b>${casa(i)}</b>: ${cur[i]} é menor que ${y}. O vizinho é 0 e não tem o que emprestar, então buscamos lá na coluna das ${casa(j)}: o ${cur[j]} vira <b>${cur[j] - 1}</b>, os zeros do caminho viram <b>9</b> e o ${cur[i]} vira <b>${cur[i] + 10}</b>.`;
      }
      cur[j] -= 1; mudou.add(j);
      for (let k = j - 1; k > i; k--) { cur[k] = 9; mudou.add(k); }
      cur[i] += 10; mudou.add(i);
      passos.push({ texto: t, html: ver(i) });
    }
    res[i] = cur[i] - y;
    let t = `Coluna das <b>${casa(i)}</b>: ${cur[i]} − ${y} = <b>${res[i]}</b>.`;
    if (!temB) t = cur[i] === 0 && i === W - 1
      ? `Coluna das <b>${casa(i)}</b>: ficou <b>0</b>, e zero à esquerda não precisa ser escrito.`
      : `Coluna das <b>${casa(i)}</b>: não tem nada embaixo, então o <b>${cur[i]}</b> desce direto.`;
    passos.push({ texto: t, html: ver(i) });
  }
  let fim = `Pronto! <b>${A} − ${B} = ${R}</b> 🎉`;
  if (R.length < W) fim += ' <small>(Zeros à esquerda não precisam ser escritos.)</small>';
  fim += `<br>Prova real: ${R} + ${B} = ${A} ✔️`;
  passos.push({ texto: fim, html: ver(null, true), fim: true });
  return { passos, resultado: R };
}

/* ---------- Multiplicação ---------- */
function resolverMultiplicacao(a, b) {
  let trocou = false;
  if (String(a).length < String(b).length) { [a, b] = [b, a]; trocou = true; }
  const A = String(a), B = String(b), R = String(a * b);
  const passos = [];
  const dica = trocou ? ' Colocamos o número maior em cima — a ordem não muda o resultado!' : '';

  if (B.length === 1) {
    const W = Math.max(A.length, R.length);
    const da = digitos(A), y = b;
    const res = [], vai = [];
    const col = i => W - i;
    const ver = hl => {
      const v = vazias(W + 1); vai.forEach((x, i) => { if (x) v[col(i)] = cel(x, 'vai'); });
      const r = vazias(W + 1); res.forEach((x, i) => { r[col(i)] = cel(x, 'res'); });
      return desenhar([
        { cells: v, cls: 'linha-vai' },
        { cells: [cel(), ...linhaNumero(A, W)] },
        { cells: [cel('×', 'op'), ...linhaNumero(B, W, hl == null ? '' : 'fator')], cls: 'traco' },
        { cells: r },
      ], hl == null ? [] : [col(hl)]);
    };
    passos.push({ texto: `Armamos a conta: ${A} em cima e ${B} embaixo, alinhado à direita.${dica} Vamos multiplicar o <b>${y}</b> por cada algarismo de cima, começando pela direita.`, html: ver(null) });
    let carry = 0;
    for (let i = 0; i < A.length; i++) {
      const x = da[i], m = x * y, p = m + carry;
      let t = `<b>${casa(i)[0].toUpperCase() + casa(i).slice(1)}</b>: ${y} × ${x} = ${m}`;
      if (carry) t += ` e somamos o "vai ${carry}": ${m} + ${carry} = <b>${p}</b>`;
      t += '. ';
      res[i] = p % 10;
      const nc = Math.floor(p / 10);
      if (nc && i < A.length - 1) { vai[i + 1] = nc; t += `Escrevemos <b>${p % 10}</b> e <b>vai ${nc}</b>.`; }
      else if (nc) { res[i + 1] = nc; t += `Como é o último, escrevemos o <b>${p}</b> inteiro.`; }
      else t += `Escrevemos <b>${p}</b>.`;
      carry = nc;
      passos.push({ texto: t, html: ver(i) });
    }
    passos.push({ texto: `Pronto! <b>${A} × ${B} = ${R}</b> 🎉`, html: ver(null), fim: true });
    return { passos, resultado: R };
  }

  // Fator de baixo com mais de um algarismo: produtos parciais + soma
  const db = digitos(B);
  const parciais = db.map((d, k) => String(a * d) + '0'.repeat(k));
  const W = Math.max(A.length, B.length, R.length, ...parciais.map(p => p.length));
  const ver = (qtd, hlB, final) => {
    const linhas = [
      { cells: [cel(), ...linhaNumero(A, W)] },
      { cells: [cel('×', 'op'), ...linhaNumero(B, W)], cls: 'traco' },
    ];
    if (hlB != null) linhas[1].cells[W - hlB].cls = 'fator';
    for (let k = 0; k < qtd; k++) {
      const p = parciais[k];
      const cells = [cel(k === parciais.length - 1 && final ? '+' : '', 'op'), ...linhaNumero(p, W)];
      for (let z = 0; z < k; z++) cells[W - z].cls = 'zero';
      linhas.push({ cells, cls: k === parciais.length - 1 && final ? 'traco' : '' });
    }
    if (final) linhas.push({ cells: [cel(), ...linhaNumero(R, W, 'res')] });
    return desenhar(linhas);
  };
  passos.push({ texto: `Armamos a conta: ${A} em cima e ${B} embaixo.${dica} Vamos multiplicar o ${A} por <b>cada algarismo</b> do ${B}, um de cada vez, e no final somar tudo.`, html: ver(0) });
  db.forEach((d, k) => {
    let t = `Agora o algarismo das <b>${casa(k)}</b>: o <b>${d}</b>. ${A} × ${d} = <b>${a * d}</b>.`;
    if (k > 0) t += ` Como ele está nas ${casa(k)}, colocamos <b>${k} zero${k > 1 ? 's' : ''}</b> no final: ${parciais[k]}.`;
    if (d === 0) t = `O algarismo das <b>${casa(k)}</b> é <b>0</b>, e qualquer número vezes 0 dá 0. Essa linha fica ${parciais[k]}.`;
    passos.push({ texto: t, html: ver(k + 1, k) });
  });
  passos.push({ texto: `Por último, <b>somamos</b> as linhas: ${parciais.join(' + ')} = <b>${R}</b>.<br>Pronto! <b>${A} × ${B} = ${R}</b> 🎉`, html: ver(parciais.length, null, true), fim: true });
  return { passos, resultado: R };
}

/* ---------- Divisão (método da chave) ---------- */
function resolverDivisao(a, b) {
  if (b === 0) return { erro: 'Não dá para dividir por zero! Tente outro divisor.' };
  const D = String(a), n = D.length, q = Math.floor(a / b), r = a % b;
  const passos = [];
  const chave = quoc => `<div class="chave"><div class="divisor">${b}</div><div class="quociente">${quoc || '&nbsp;'}</div></div>`;

  if (a < b) {
    passos.push({ texto: `O ${b} é maior que o ${a}, então ele <b>não cabe nenhuma vez</b>. O resultado é <b>0</b> e sobra <b>resto ${a}</b>.`, html: `<div class="divisao">${desenhar([{ cells: linhaNumero(D, n) }])}${chave('0')}</div>`, fim: true });
    return { passos, resultado: '0', resto: a };
  }

  const linhas = [{ s: D, fim: n - 1 }]; // fim = coluna (0..n-1) do último algarismo
  const ver = (quoc, ini, fim) => {
    const grade = linhas.map(l => {
      const cells = vazias(n + 1);
      const comeco = l.fim - l.s.length + 1;
      for (let i = 0; i < l.s.length; i++) cells[comeco + i + 1] = cel(l.s[i], (l.cls || '') + (l.menos ? ' sub' : ''));
      if (l.menos) cells[comeco] = cel('−', 'op sub');
      return { cells };
    });
    const dest = [];
    if (ini != null) for (let c = ini; c <= fim; c++) dest.push(c + 1);
    return `<div class="divisao">${desenhar(grade, dest)}${chave(quoc)}</div>`;
  };

  passos.push({ texto: `Montamos a <b>chave</b>: o ${D} (dividendo) fica do lado esquerdo e o ${b} (divisor) dentro da chave. Vamos dividir começando pela <b>esquerda</b>.`, html: ver('') });

  let idx = 0, cur = 0;
  while (cur < b) { cur = cur * 10 + Number(D[idx]); idx++; }
  let fim = idx - 1, curS = D.slice(0, idx), quoc = '';
  passos.push({
    texto: idx > 1
      ? `O ${b} não cabe em ${D.slice(0, idx - 1)}, então pegamos mais um algarismo: <b>${curS}</b>.`
      : `Começamos pelo primeiro algarismo: <b>${curS}</b>.`,
    html: ver('', fim - curS.length + 1, fim),
  });

  for (;;) {
    const qd = Math.floor(cur / b), prod = qd * b, resto = cur - prod;
    quoc += qd;
    const ini = fim - curS.length + 1;
    if (qd === 0) {
      if (idx < n) {
        const dg = D[idx];
        passos.push({ texto: `O ${b} <b>não cabe</b> em ${cur}. Então escrevemos <b>0</b> no quociente.`, html: ver(quoc, ini, fim) });
        const ultima = linhas[linhas.length - 1];
        ultima.s += dg; ultima.fim += 1;
        curS = ultima.s; cur = Number(curS); idx++; fim++;
        passos.push({ texto: `<b>Baixamos o ${dg}</b> e ficamos com ${cur}.`, html: ver(quoc, fim - curS.length + 1, fim) });
        continue;
      }
      passos.push({ texto: `O ${b} <b>não cabe</b> em ${cur}. Escrevemos <b>0</b> no quociente e o ${cur} é o que sobra.`, html: ver(quoc, ini, fim) });
      break;
    }
    let t = `Quantas vezes o ${b} cabe em ${cur}? Pensando na tabuada do ${b}: ${b} × ${qd} = ${prod}`;
    t += ` <small>(e ${b} × ${qd + 1} = ${b * (qd + 1)} já passa de ${cur})</small>. Escrevemos <b>${qd}</b> no quociente e o ${prod} embaixo do ${cur}.`;
    linhas.push({ s: String(prod), fim, menos: true });
    passos.push({ texto: t, html: ver(quoc, ini, fim) });
    if (idx < n) {
      const dg = D[idx], novo = String(resto) + dg;
      linhas.push({ s: novo, fim: fim + 1 });
      t = `Subtraímos: ${cur} − ${prod} = <b>${resto}</b>. Depois <b>baixamos o ${dg}</b> e ficamos com ${Number(novo)}.`;
      cur = Number(novo); curS = novo; idx++; fim++;
      passos.push({ texto: t, html: ver(quoc, fim - curS.length + 1, fim) });
    } else {
      linhas.push({ s: String(resto), fim, cls: 'res' });
      passos.push({ texto: `Subtraímos: ${cur} − ${prod} = <b>${resto}</b>. Não há mais algarismos para baixar.`, html: ver(quoc) });
      break;
    }
  }

  let fimT = `Pronto! <b>${a} ÷ ${b} = ${q}</b>`;
  fimT += r ? ` e sobra <b>resto ${r}</b>.` : ' (divisão exata, resto 0).';
  fimT += `<br>Prova real: ${q} × ${b}${r ? ` + ${r}` : ''} = ${a} ✔️`;
  passos.push({ texto: fimT, html: ver(String(q)), fim: true });
  return { passos, resultado: String(q), resto: r };
}

function resolver(a, op, b) {
  switch (op) {
    case '+': return resolverSoma(a, b);
    case '-': return resolverSubtracao(a, b);
    case '×': return resolverMultiplicacao(a, b);
    case '÷': return resolverDivisao(a, b);
  }
  return { erro: 'Operação desconhecida.' };
}

/* ---------- Gerador de exercícios ---------- */
const sorteio = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function gerarExercicio(op, nivel) {
  if (op === 'mix') op = ['+', '-', '×', '÷'][sorteio(0, 3)];
  let a, b;
  if (op === '+') {
    const f = [[1, 9], [10, 99], [100, 999]][nivel - 1];
    a = sorteio(...f); b = sorteio(...f);
  } else if (op === '-') {
    const f = [[1, 10, 0], [20, 99, 10], [200, 999, 100]][nivel - 1];
    a = sorteio(f[0], f[1]); b = sorteio(f[2], a);
  } else if (op === '×') {
    const f = [[1, 5, 1, 10], [2, 10, 2, 10], [11, 99, 2, 9]][nivel - 1];
    a = sorteio(f[0], f[1]); b = sorteio(f[2], f[3]);
  } else {
    const f = [[2, 5, 1, 10], [2, 10, 2, 10], [2, 9, 11, 99]][nivel - 1];
    b = sorteio(f[0], f[1]); a = b * sorteio(f[2], f[3]);
  }
  const resp = { '+': a + b, '-': a - b, '×': a * b, '÷': a / b }[op];
  return { a, b, op, resposta: resp };
}

if (typeof module !== 'undefined') module.exports = { resolver, gerarExercicio };
