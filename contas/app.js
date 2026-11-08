'use strict';
/* Interface do app: abas, "Me ajude", treino e tabuada. */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- Estrelas (guardadas no navegador) ---------- */
let estrelas = 0;
try { estrelas = Number(localStorage.getItem('contas-estrelas')) || 0; } catch (e) { /* sem armazenamento */ }
function ganharEstrela() {
  estrelas++;
  $('#estrelas').textContent = estrelas;
  const p = $('.placar'); p.classList.remove('pulo'); void p.offsetWidth; p.classList.add('pulo');
  try { localStorage.setItem('contas-estrelas', estrelas); } catch (e) { /* ignora */ }
}
$('#estrelas').textContent = estrelas;

function festa() {
  const f = $('#festa');
  const emojis = ['⭐', '🎉', '✨', '🌟', '🎈'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.textContent = emojis[i % emojis.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.4 + 's';
    f.appendChild(s);
    setTimeout(() => s.remove(), 2200);
  }
}

/* ---------- Abas ---------- */
function irPara(aba) {
  $$('.aba').forEach(x => x.classList.toggle('ativa', x.dataset.aba === aba));
  $$('.painel').forEach(p => p.classList.toggle('ativo', p.id === aba));
  window.scrollTo({ top: 0 });
}
$$('.aba').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.aba !== 'bolinhas') $('#bol-voltar').hidden = true;
  irPara(b.dataset.aba);
}));

function escolhaUnica(container, aoMudar) {
  container.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    container.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
    aoMudar && aoMudar(b);
  });
}

/* ---------- Visualizador de passo a passo ---------- */
function mostrarPassos(alvo, res) {
  let i = 0;
  const { passos } = res;
  alvo.innerHTML = `
    <div class="cartao passos">
      <div class="contador"></div>
      <div class="barra"><div></div></div>
      <div class="quadro"></div>
      <p class="explica"></p>
      <div class="nav">
        <button class="grande secundario" data-a="ant">⬅️ Voltar</button>
        <button class="grande primario" data-a="prox">Próximo passo ➡️</button>
        <button class="pequeno" data-a="fim">Ver resposta</button>
      </div>
    </div>`;
  const el = s => alvo.querySelector(s);
  const atualizar = () => {
    const p = passos[i];
    el('.contador').textContent = `Passo ${i + 1} de ${passos.length}`;
    el('.barra div').style.width = ((i + 1) / passos.length * 100) + '%';
    el('.quadro').innerHTML = p.html;
    el('.explica').innerHTML = p.texto;
    el('.explica').classList.toggle('fim', !!p.fim);
    el('[data-a="ant"]').disabled = i === 0;
    el('[data-a="prox"]').disabled = i === passos.length - 1;
    el('[data-a="fim"]').hidden = i === passos.length - 1;
    if (p.fim && i > 0) festa();
  };
  alvo.querySelector('.nav').addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'ant' && i > 0) i--;
    else if (a === 'prox' && i < passos.length - 1) i++;
    else if (a === 'fim') i = passos.length - 1;
    else return;
    atualizar();
  });
  atualizar();
  alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Me ajude ---------- */
let opAjuda = '+';
escolhaUnica($('#ajuda-ops'), b => { opAjuda = b.dataset.op; });
['#num1', '#num2'].forEach(s => $(s).addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '');
}));

$('#form-ajuda').addEventListener('submit', e => {
  e.preventDefault();
  const erro = $('#erro-ajuda');
  const destino = $('#passos-ajuda');
  const v1 = $('#num1').value, v2 = $('#num2').value;
  const falha = msg => { erro.textContent = msg; erro.hidden = false; destino.innerHTML = ''; };
  if (!v1 || !v2) return falha('Escreva os dois números da conta. ✏️');
  const a = Number(v1), b = Number(v2);
  if (opAjuda === '×' && Math.min(String(a).length, String(b).length) > 3)
    return falha('Essa multiplicação é grande demais! Use até 3 algarismos em um dos números.');
  const res = resolver(a, opAjuda, b);
  if (res.erro) return falha(res.erro);
  erro.hidden = true;
  mostrarPassos(destino, res);
});

$('#ajuda-bol').addEventListener('click', () => {
  const v1 = $('#num1').value, v2 = $('#num2').value;
  if (!v1 || !v2) {
    const erro = $('#erro-ajuda');
    erro.textContent = 'Escreva os dois números da conta. ✏️'; erro.hidden = false;
    return;
  }
  abrirBolinhas(Number(v1), opAjuda, Number(v2), false);
});

/* ---------- Contar com bolinhas ---------- */
const OBJETOS = ['⚽', '🏀', '⚾', '🎾', '🍎', '🍓', '⭐', '🐶', '🐱', '🚗', '🔵'];
const LIMITE_BOLAS = 100;
let objeto = '⚽', opBol = '+', mesa = null, autoTimer = null;
try { objeto = localStorage.getItem('contas-objeto') || '⚽'; } catch (e) { /* ignora */ }

function primeiroDesenho(txt) {
  txt = txt.trim();
  if (!txt) return '';
  if (window.Intl && Intl.Segmenter) {
    const seg = new Intl.Segmenter('pt', { granularity: 'grapheme' }).segment(txt)[Symbol.iterator]().next();
    return seg.value ? seg.value.segment : '';
  }
  return Array.from(txt)[0];
}
function guardarObjeto(o) {
  objeto = o;
  try { localStorage.setItem('contas-objeto', o); } catch (e) { /* ignora */ }
  if (mesa) desenharMesa();
}
const objetos = $('#bol-objetos');
objetos.innerHTML = OBJETOS.map(o => `<button class="chip" aria-label="Contar com ${o}">${o}</button>`).join('');
function marcarObjeto() {
  let achou = false;
  objetos.querySelectorAll('button').forEach(b => { const s = b.textContent === objeto; b.classList.toggle('sel', s); achou = achou || s; });
  $('#bol-custom').classList.toggle('sel', !achou);
  if (!achou) $('#bol-custom').value = objeto;
}
escolhaUnica(objetos, b => { $('#bol-custom').value = ''; guardarObjeto(b.textContent); marcarObjeto(); });
$('#bol-custom').addEventListener('input', e => {
  const o = primeiroDesenho(e.target.value);
  if (o) { guardarObjeto(o); marcarObjeto(); }
});
marcarObjeto();

escolhaUnica($('#bol-ops'), b => { opBol = b.dataset.op; });
['#bol1', '#bol2'].forEach(s => $(s).addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '');
}));
$('#form-bol').addEventListener('submit', e => {
  e.preventDefault();
  const v1 = $('#bol1').value, v2 = $('#bol2').value;
  if (!v1 || !v2) return erroBolinhas('Escreva os dois números. ✏️');
  montarMesa(Number(v1), opBol, Number(v2));
});

function erroBolinhas(msg) {
  const e = $('#erro-bol');
  e.textContent = msg; e.hidden = !msg;
  $('#mesa').hidden = !!msg;
}

function abrirBolinhas(a, op, b, doTreino) {
  $('#bol1').value = a; $('#bol2').value = b; opBol = op;
  $('#bol-ops').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x.dataset.op === op));
  $('#bol-voltar').hidden = !doTreino;
  irPara('bolinhas');
  montarMesa(a, op, b);
}

function montarMesa(a, op, b) {
  pararAuto();
  if (op === '-' && a < b) return erroBolinhas('Não dá para tirar mais bolinhas do que temos! O primeiro número precisa ser maior.');
  if (op === '÷' && b === 0) return erroBolinhas('Não dá para repartir entre zero amigos! Use um número maior que 0.');
  if (op === '÷' && b > 10) return erroBolinhas('São amigos demais! Para repartir, use até 10 amigos.');
  const total = { '+': a + b, '-': a, '×': a * b, '÷': a }[op];
  if (total > LIMITE_BOLAS) return erroBolinhas(`Seriam ${total} bolinhas, é muita coisa para contar! Use números menores (até ${LIMITE_BOLAS} bolinhas) ou peça ajuda na aba 🆘 Me ajude.`);
  erroBolinhas('');
  const bolas = [];
  const add = (n, grupo) => { for (let i = 0; i < n; i++) bolas.push({ grupo, tirada: false, num: 0, caixa: -1 }); };
  if (op === '+') { add(a, 0); add(b, 1); }
  else if (op === '×') for (let g = 0; g < b; g++) add(a, g);
  else add(a, 0);
  const alvo = { '+': a + b, '-': a - b, '×': a * b, '÷': Math.floor(a / b) }[op];
  mesa = { a, op, b, bolas, alvo, contei: 0, tiradas: 0, dadas: 0, ultima: -1,
    fase: op === '-' && b > 0 ? 'tirar' : op === '÷' ? 'repartir' : 'contar' };
  verificarFim();
  desenharMesa();
}

function verificarFim() {
  const m = mesa;
  if (m.fase === 'tirar' && m.tiradas === m.b) m.fase = 'contar';
  if (m.fase === 'contar' && m.contei === m.alvo) m.fase = 'fim';
  if (m.fase === 'repartir' && m.a - m.dadas < m.b) m.fase = 'fim';
}

function tocarBola(i) {
  const m = mesa, bola = m.bolas[i];
  if (!bola || m.fase === 'fim') return;
  if (m.fase === 'tirar') {
    if (bola.tirada) return;
    bola.tirada = true; m.tiradas++;
  } else if (m.fase === 'contar') {
    if (bola.tirada || bola.num) return;
    bola.num = ++m.contei;
  } else if (m.fase === 'repartir') {
    if (bola.caixa >= 0) return;
    bola.caixa = m.dadas % m.b; m.dadas++;
  }
  m.ultima = i;
  verificarFim();
  desenharMesa();
  if (m.fase === 'fim') { pararAuto(); festa(); }
}

function proximaBola() {
  const m = mesa, bs = m.bolas;
  if (m.fase === 'tirar') { for (let i = bs.length - 1; i >= 0; i--) if (!bs[i].tirada) return i; }
  if (m.fase === 'contar') return bs.findIndex(x => !x.tirada && !x.num);
  if (m.fase === 'repartir') return bs.findIndex(x => x.caixa < 0);
  return -1;
}

function pararAuto() {
  clearInterval(autoTimer); autoTimer = null;
  $('#bol-auto').textContent = '🗣️ Contar junto';
}
$('#bol-auto').addEventListener('click', () => {
  if (autoTimer) return pararAuto();
  if (!mesa || mesa.fase === 'fim') return;
  $('#bol-auto').textContent = '⏸️ Parar';
  autoTimer = setInterval(() => {
    const i = proximaBola();
    if (i < 0) return pararAuto();
    tocarBola(i);
  }, 700);
});
$('#bol-reset').addEventListener('click', () => { if (mesa) montarMesa(mesa.a, mesa.op, mesa.b); });
$('#bol-voltar').addEventListener('click', () => { pararAuto(); $('#bol-voltar').hidden = true; irPara('treino'); });

function htmlBolas(lista) {
  // agrupa de 5 em 5 para facilitar a contagem
  let h = '';
  for (let k = 0; k < lista.length; k += 5) {
    h += '<span class="cinco">' + lista.slice(k, k + 5).map(({ bola, i }) => {
      const cls = ['bola'];
      if (bola.num) cls.push('contada');
      if (bola.tirada) cls.push('tirada');
      if (i === mesa.ultima) cls.push('pop');
      const num = bola.num ? `<span class="num">${bola.num}</span>` : '';
      return `<button class="${cls.join(' ')}" data-i="${i}" aria-label="${objeto} ${i + 1}">${objeto}${num}</button>`;
    }).join('') + '</span>';
  }
  return h;
}

function desenharMesa() {
  const m = mesa, { a, b, op } = m, o = objeto;
  const sim = { '+': '+', '-': '−', '×': '×', '÷': '÷' }[op];
  const comIndice = m.bolas.map((bola, i) => ({ bola, i }));
  const doGrupo = g => comIndice.filter(x => x.bola.grupo === g);
  let area = '', instr = '', cont = '';

  if (op === '+') {
    area = `<div class="grupo-bolas">${htmlBolas(doGrupo(0))}</div><span class="sinal">+</span><div class="grupo-bolas g1">${htmlBolas(doGrupo(1))}</div>`;
    instr = `Temos <b>${a}</b> ${o} de um lado e mais <b>${b}</b> ${o} do outro. Toque em cada um para contar <b>quantos tem ao todo</b>!`;
  } else if (op === '-') {
    area = `<div class="grupo-bolas">${htmlBolas(doGrupo(0))}</div>`;
    instr = m.fase === 'tirar'
      ? `Temos <b>${a}</b> ${o}. Toque em <b>${b}</b> deles para <b>tirar</b>. Falta tirar <b>${b - m.tiradas}</b>.`
      : `Tiramos ${b}. Agora toque nos que <b>sobraram</b> para contar!`;
  } else if (op === '×') {
    area = Array.from({ length: b }, (_, g) =>
      `<div class="grupo-bolas${g % 2 ? ' g1' : ''}"><span class="rotulo">grupo ${g + 1}</span>${htmlBolas(doGrupo(g))}</div>`).join('');
    instr = `São <b>${b} grupos</b> com <b>${a}</b> ${o} em cada um. Conte todos!`;
    if (b > 1 && a > 0) instr += `<br><small>Dica: ${Array(b).fill(a).join(' + ')}</small>`;
  } else {
    const monte = comIndice.filter(x => x.bola.caixa < 0);
    area = `<div class="grupo-bolas monte"><span class="rotulo">para repartir</span>${htmlBolas(monte)}</div>`;
    area += '<div class="caixas">' + Array.from({ length: b }, (_, c) =>
      `<div class="grupo-bolas caixa"><span class="rotulo">🧒 ${c + 1}</span>${htmlBolas(comIndice.filter(x => x.bola.caixa === c))}</div>`).join('') + '</div>';
    instr = `Vamos repartir <b>${a}</b> ${o} entre <b>${b} amigos</b>. Toque numa bolinha para dar ao próximo amigo, <b>um de cada vez</b>.`;
  }

  if (m.fase === 'contar') cont = m.contei ? `Contei: ${m.contei}` : '';
  if (m.fase === 'repartir') cont = m.dadas ? `Já dei ${m.dadas} de ${a}` : '';
  if (m.fase === 'fim') {
    if (op === '÷') {
      const q = Math.floor(a / b), r = a % b;
      instr = `🎉 Cada amigo ficou com <b>${q}</b> ${o}` + (r ? ` e <b>sobr${r > 1 ? 'aram' : 'ou'} ${r}</b>, que não dá para repartir.` : '.') +
        `<br><b>${a} ÷ ${b} = ${q}</b>${r ? ` (resto ${r})` : ''}`;
    } else {
      const resp = m.alvo;
      instr = `🎉 Muito bem! ${op === '-' ? 'Sobraram' : 'Deu'} <b>${resp}</b> ${o}.<br><b>${a} ${sim} ${b} = ${resp}</b>`;
      if (resp === 0) instr = `${op === '×' ? 'Qualquer número vezes 0 dá 0!' : 'Não sobrou nada!'}<br><b>${a} ${sim} ${b} = 0</b>`;
    }
    cont = '';
  }

  $('#bol-titulo').textContent = `${a} ${sim} ${b} = ${m.fase === 'fim' ? (op === '÷' ? Math.floor(a / b) : m.alvo) : '?'}`;
  const ins = $('#bol-instr'); ins.innerHTML = instr; ins.classList.toggle('fim', m.fase === 'fim');
  const ar = $('#bol-area'); ar.innerHTML = area; ar.classList.toggle('muitas', m.bolas.length > 40);
  $('#bol-cont').textContent = cont;
  m.ultima = -1;
}
$('#bol-area').addEventListener('click', e => {
  const b = e.target.closest('.bola');
  if (b) { pararAuto(); tocarBola(Number(b.dataset.i)); }
});
montarMesa(3, '+', 4);

/* ---------- Treino ---------- */
let opTreino = '+', nivel = 1, atual = null, digitado = '', tentativas = 0, acertou = false, seq = 0;
const SIMBOLO = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
const ELOGIOS = ['Muito bem! 🎉', 'Arrasou! 🌟', 'Isso aí! 💪', 'Mandou bem! 🚀', 'Perfeito! ✨', 'Você é fera! 🦁'];
const FORCA = ['Quase! Tente de novo 💪', 'Não foi dessa vez. Confira a conta! 🔍', 'Respira e tenta outra vez 🙂'];

function novoExercicio() {
  atual = gerarExercicio(opTreino, nivel);
  digitado = ''; tentativas = 0; acertou = false;
  $('#pergunta').textContent = `${atual.a} ${SIMBOLO[atual.op]} ${atual.b} =`;
  const r = $('#resposta'); r.textContent = '?'; r.className = 'resposta';
  const f = $('#feedback'); f.textContent = ''; f.className = 'feedback';
  $('#passos-treino').innerHTML = '';
}

function digitar(k) {
  if (acertou) { if (k === 'ok') novoExercicio(); return; }
  const r = $('#resposta');
  r.className = 'resposta';
  if (k === 'apagar') digitado = digitado.slice(0, -1);
  else if (k === 'ok') return conferir();
  else if (digitado.length < 6) digitado = (digitado === '0' ? '' : digitado) + k;
  r.textContent = digitado || '?';
}

function conferir() {
  if (!digitado) return;
  const r = $('#resposta'), f = $('#feedback');
  if (Number(digitado) === atual.resposta) {
    acertou = true; seq++;
    r.className = 'resposta certo';
    f.className = 'feedback bom';
    f.textContent = ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)] + (seq > 0 && seq % 5 === 0 ? ` ${seq} seguidas!` : '');
    if (tentativas === 0) ganharEstrela();
    festa();
  } else {
    tentativas++; seq = 0;
    r.className = 'resposta errado';
    f.className = 'feedback ruim';
    f.textContent = tentativas >= 2
      ? 'Que tal ver como resolve? Toque em 🤔 Como resolve?'
      : FORCA[Math.floor(Math.random() * FORCA.length)];
    digitado = '';
    setTimeout(() => { if (!acertou && !digitado) r.textContent = '?'; }, 700);
  }
  $('#seq').textContent = seq;
}

$('#teclado').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) digitar(b.dataset.k || b.textContent);
});
document.addEventListener('keydown', e => {
  if (!$('#treino').classList.contains('ativo') || e.target.tagName === 'INPUT') return;
  if (/^\d$/.test(e.key)) digitar(e.key);
  else if (e.key === 'Backspace') digitar('apagar');
  else if (e.key === 'Enter') { e.preventDefault(); digitar('ok'); }
});
$('#btn-proxima').addEventListener('click', novoExercicio);
$('#btn-bol').addEventListener('click', () => abrirBolinhas(atual.a, atual.op, atual.b, true));
$('#btn-como').addEventListener('click', () => {
  tentativas = Math.max(tentativas, 1); // ver a resposta não vale estrela
  mostrarPassos($('#passos-treino'), resolver(atual.a, atual.op, atual.b));
});
escolhaUnica($('#treino-op'), b => { opTreino = b.dataset.v; novoExercicio(); });
escolhaUnica($('#treino-nivel'), b => { nivel = Number(b.dataset.v); novoExercicio(); });
novoExercicio();

/* ---------- Tabuada ---------- */
let numTab = 1;
const tabNum = $('#tab-num');
for (let n = 1; n <= 10; n++) tabNum.insertAdjacentHTML('beforeend', `<button class="chip${n === 1 ? ' sel' : ''}">${n}</button>`);
function desenharTabuada() {
  $('#tab-titulo').textContent = `Tabuada do ${numTab}`;
  $('#tab-lista').innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<button class="tab-item">${numTab} × ${i + 1} = <span class="r">?</span></button>`).join('');
}
$('#tab-lista').addEventListener('click', e => {
  const b = e.target.closest('.tab-item');
  if (!b) return;
  const i = Array.from(b.parentNode.children).indexOf(b) + 1;
  b.classList.toggle('aberto');
  b.querySelector('.r').textContent = b.classList.contains('aberto') ? numTab * i : '?';
});
$('#tab-todas').addEventListener('click', () => {
  $$('.tab-item').forEach((b, i) => { b.classList.add('aberto'); b.querySelector('.r').textContent = numTab * (i + 1); });
});
escolhaUnica(tabNum, b => { numTab = Number(b.textContent); desenharTabuada(); });
desenharTabuada();
