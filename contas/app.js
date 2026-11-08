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
$$('.aba').forEach(b => b.addEventListener('click', () => {
  $$('.aba').forEach(x => x.classList.toggle('ativa', x === b));
  $$('.painel').forEach(p => p.classList.toggle('ativo', p.id === b.dataset.aba));
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
escolhaUnica($('.ops'), b => { opAjuda = b.dataset.op; });
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
