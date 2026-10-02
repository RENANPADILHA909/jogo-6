/* =========================================================
   ECOSORT — script.js  (reescrito e corrigido)
   Jogo de classificação científica · Ciências 6º ano
   ========================================================= */

/* ---------------------------------------------------------
   1. DADOS DAS MISSÕES
   --------------------------------------------------------- */
const MISSOES = [
  {
    titulo: "Missão 1 — Quem Come o Quê?",
    descricao: "Observe o animal e descubra de que ele se alimenta.",
    categorias: [
      { id: "herbivoro", nome: "Herbívoros", emoji: "🌿", cor: "#35d07f", dica: "Alimentam-se de plantas" },
      { id: "carnivoro", nome: "Carnívoros", emoji: "🍖", cor: "#ff5a4e", dica: "Alimentam-se de outros animais" },
      { id: "onivoro",   nome: "Onívoros",   emoji: "🍽️", cor: "#ffa62b", dica: "Comem alimentos de origem animal e vegetal" }
    ],
    itens: [
      { nome: "Vaca",      emoji: "🐄", cat: "herbivoro" },
      { nome: "Coelho",    emoji: "🐇", cat: "herbivoro" },
      { nome: "Gafanhoto", emoji: "🦗", cat: "herbivoro" },
      { nome: "Leão",      emoji: "🦁", cat: "carnivoro" },
      { nome: "Tubarão",   emoji: "🦈", cat: "carnivoro" },
      { nome: "Coruja",    emoji: "🦉", cat: "carnivoro" },
      { nome: "Porco",     emoji: "🐖", cat: "onivoro"   },
      { nome: "Urso",      emoji: "🐻", cat: "onivoro"   }
    ]
  },
  {
    titulo: "Missão 2 — Laboratório de Misturas",
    descricao: "Dá para enxergar mais de um componente? Então é heterogênea!",
    categorias: [
      { id: "homogenea",   nome: "Mistura Homogênea",   emoji: "💧", cor: "#4aa8ff", dica: "Parece uma coisa só — não dá para ver os componentes" },
      { id: "heterogenea", nome: "Mistura Heterogênea", emoji: "🪨", cor: "#a86bff", dica: "Dá para ver mais de um componente" }
    ],
    itens: [
      { nome: "Água + açúcar",             emoji: "🥄", cat: "homogenea"   },
      { nome: "Água + sal",                emoji: "🧂", cat: "homogenea"   },
      { nome: "Ar atmosférico",            emoji: "💨", cat: "homogenea"   },
      { nome: "Água + álcool",             emoji: "⚗️", cat: "homogenea"   },
      { nome: "Água + areia",              emoji: "🏖️", cat: "heterogenea" },
      { nome: "Água + óleo",               emoji: "🫗", cat: "heterogenea" },
      { nome: "Granito",                   emoji: "🪨", cat: "heterogenea" },
      { nome: "Suco com pedaços de fruta", emoji: "🍹", cat: "heterogenea" }
    ]
  },
  {
    titulo: "Missão 3 — Física ou Química?",
    descricao: "A matéria só mudou de aparência ou virou uma nova substância?",
    categorias: [
      { id: "fisica",  nome: "Transformação Física",  emoji: "🧊", cor: "#28d6d0", dica: "A substância continua sendo a mesma" },
      { id: "quimica", nome: "Transformação Química", emoji: "💥", cor: "#f2545b", dica: "Surge uma nova substância" }
    ],
    itens: [
      { nome: "Gelo derretendo",    emoji: "🧊", cat: "fisica"  },
      { nome: "Amassar uma lata",   emoji: "🥫", cat: "fisica"  },
      { nome: "Água fervendo",      emoji: "♨️", cat: "fisica"  },
      { nome: "Cortar uma folha",   emoji: "✂️", cat: "fisica"  },
      { nome: "Papel queimando",    emoji: "🔥", cat: "quimica" },
      { nome: "Ferro enferrujando", emoji: "🔩", cat: "quimica" },
      { nome: "Bolo assando",       emoji: "🎂", cat: "quimica" },
      { nome: "Leite azedando",     emoji: "🥛", cat: "quimica" }
    ]
  }
];

/* ---------------------------------------------------------
   2. CONFIGURAÇÕES E ESTADO
   --------------------------------------------------------- */
const TEMPO_ITEM   = 20;   // segundos por item
const PONTOS_BASE  = 100;  // pontos por acerto (x multiplicador)
const BONUS_MISSAO = 25;   // bônus por acerto ao fim de cada missão
const VIDAS_MAX    = 5;

const estado = {
  missaoIndex:   0,
  itemIndex:     0,
  pontos:        0,
  vidas:         VIDAS_MAX,
  combo:         0,
  melhorCombo:   0,
  acertos:       0,
  erros:         0,
  acertosMissao: 0,
  itensMissao:   [],
  itemAtual:     null,
  selecionado:   false,
  travado:       true,
  som:           true
};

/* ---------------------------------------------------------
   3. UTILITÁRIOS
   --------------------------------------------------------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function embaralhar(lista){
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rgba(hex, alpha){
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function multiplicadorAtual(){
  return Math.min(3, 1 + Math.floor(estado.combo / 3));
}

/* ---------------------------------------------------------
   4. SOM (Web Audio API — sem arquivos externos)
   --------------------------------------------------------- */
let audioCtx = null;

function tocarSom(tipo){
  if (!estado.som) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const agora = audioCtx.currentTime;
    osc.type = 'triangle';

    if (tipo === 'certo'){
      osc.frequency.setValueAtTime(660, agora);
      osc.frequency.setValueAtTime(990, agora + 0.09);
    } else if (tipo === 'errado'){
      osc.frequency.setValueAtTime(230, agora);
      osc.frequency.exponentialRampToValueAtTime(110, agora + 0.28);
    } else {
      osc.frequency.setValueAtTime(520, agora);
    }

    gain.gain.setValueAtTime(0.0001, agora);
    gain.gain.exponentialRampToValueAtTime(0.14, agora + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.32);

    osc.start(agora);
    osc.stop(agora + 0.34);
  } catch (e) { /* som é opcional */ }
}

/* ---------------------------------------------------------
   5. TELAS
   --------------------------------------------------------- */
const TELAS = ['tela-inicio', 'tela-jogo', 'tela-missao', 'tela-final'];

function mostrarTela(id){
  /* Sempre que saímos do jogo, matamos o timer para evitar
     disparos fantasma depois da troca de tela. */
  if (id !== 'tela-jogo') pararTimer();

  TELAS.forEach(t => {
    document.getElementById(t).classList.toggle('tela--ativa', t === id);
  });
  $('#hud').classList.toggle('hud--oculto', id === 'tela-inicio');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------------------------------------------------
   6. HUD
   --------------------------------------------------------- */
function atualizarHud(){
  $('#hud-missao').textContent = `${estado.missaoIndex + 1}/${MISSOES.length}`;
  $('#hud-pontos').textContent = estado.pontos;

  const mult = multiplicadorAtual();
  const elCombo = $('#hud-combo');
  elCombo.textContent = `x${mult}`;
  elCombo.classList.toggle('stat__valor--brilho', mult > 1);

  const cheias = Math.max(0, estado.vidas);
  const vazias = Math.max(0, VIDAS_MAX - estado.vidas);
  $('#hud-vidas').textContent = '💚'.repeat(cheias) + '🖤'.repeat(vazias);
}

/* ---------------------------------------------------------
   7. TOAST
   --------------------------------------------------------- */
let toastTimeout = null;

function mostrarToast(msg, tipo = 'info'){
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast toast--${tipo} toast--visivel`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('toast--visivel'), 1700);
}

/* ---------------------------------------------------------
   8. MONTAGEM DAS CAIXAS
   --------------------------------------------------------- */
function montarCaixas(categorias){
  const container = $('#caixas');
  container.innerHTML = '';

  categorias.forEach(cat => {
    const caixa = document.createElement('div');
    caixa.className = 'caixa';
    caixa.dataset.cat = cat.id;
    caixa.setAttribute('role', 'button');
    caixa.setAttribute('tabindex', '0');
    caixa.style.setProperty('--cor', cat.cor);
    caixa.style.setProperty('--cor-suave', rgba(cat.cor, 0.18));

    caixa.innerHTML = `
      <div class="caixa__cabeca">
        <span class="caixa__emoji">${cat.emoji}</span>
        <h3 class="caixa__nome">${cat.nome}</h3>
      </div>
      <p class="caixa__dica">${cat.dica}</p>
      <div class="caixa__itens"></div>
    `;

    caixa.addEventListener('click', () => aoClicarCaixa(cat.id));
    caixa.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        aoClicarCaixa(cat.id);
      }
    });

    container.appendChild(caixa);
  });
}

function adicionarChip(caixa, item){
  const alvo = caixa.querySelector('.caixa__itens');
  if (!alvo) return;
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = `${item.emoji} ${item.nome}`;
  alvo.appendChild(chip);
}

/* ---------------------------------------------------------
   9. FLUXO DO JOGO
   --------------------------------------------------------- */
function iniciarJogo(){
  estado.missaoIndex   = 0;
  estado.itemIndex     = 0;
  estado.pontos        = 0;
  estado.vidas         = VIDAS_MAX;
  estado.combo         = 0;
  estado.melhorCombo   = 0;
  estado.acertos       = 0;
  estado.erros         = 0;
  estado.acertosMissao = 0;
  estado.itemAtual     = null;
  estado.selecionado   = false;
  estado.travado       = true;

  /* Reseta o botão de reinício para o estado "vitória" padrão */
  const btn = $('#btn-reiniciar');
  btn.classList.remove('btn--perigo');
  btn.textContent = 'Jogar novamente 🔁';

  /* Garante que o elemento visual do item esteja limpo */
  const el = $('#item-atual');
  el.className = 'item';
  el.style.transform  = '';
  el.style.transition = '';

  carregarMissao();
}

function carregarMissao(){
  const missao = MISSOES[estado.missaoIndex];

  estado.itensMissao   = embaralhar(missao.itens);
  estado.itemIndex     = 0;
  estado.acertosMissao = 0;

  $('#missao-titulo').textContent    = missao.titulo;
  $('#missao-descricao').textContent = missao.descricao;

  montarCaixas(missao.categorias);
  atualizarHud();
  mostrarTela('tela-jogo');
  proximoItem();
}

function proximoItem(){
  if (estado.itemIndex >= estado.itensMissao.length){
    fimDaMissao();
    return;
  }

  const item = estado.itensMissao[estado.itemIndex];
  estado.itemAtual   = item;
  estado.travado     = false;
  estado.selecionado = false;

  const el = $('#item-atual');
  el.className = 'item';                 // limpa classes de feedback
  el.style.transform  = '';
  el.style.transition = '';
  el.querySelector('.item__emoji').textContent = item.emoji;
  el.querySelector('.item__nome').textContent  = item.nome;

  $('#contador-itens').textContent =
    `${estado.itemIndex + 1} / ${estado.itensMissao.length}`;

  iniciarTimer();
}

/* ---------------------------------------------------------
   10. TEMPORIZADOR
   --------------------------------------------------------- */
let timeoutFim    = null;
let timeoutAlerta = null;

function iniciarTimer(){
  pararTimer();

  const barra = $('#timer-barra');
  barra.classList.remove('timer__barra--alerta');
  barra.style.transition = 'none';
  barra.style.width = '100%';
  void barra.offsetWidth;               // força reflow
  barra.style.transition = `width ${TEMPO_ITEM}s linear`;
  barra.style.width = '0%';

  timeoutAlerta = setTimeout(
    () => barra.classList.add('timer__barra--alerta'),
    (TEMPO_ITEM - 6) * 1000
  );

  timeoutFim = setTimeout(() => {
    if (!estado.travado) classificar(null);   // tempo esgotado
  }, TEMPO_ITEM * 1000);
}

function pararTimer(){
  clearTimeout(timeoutFim);
  clearTimeout(timeoutAlerta);
  timeoutFim = null;
  timeoutAlerta = null;

  const barra = $('#timer-barra');
  if (!barra) return;

  const larguraTotal = barra.parentElement.getBoundingClientRect().width;
  if (!larguraTotal) return;                // protege contra divisão por 0

  const larguraAtual = barra.getBoundingClientRect().width;
  barra.style.transition = 'none';
  barra.style.width = `${(larguraAtual / larguraTotal) * 100}%`;
}

/* ---------------------------------------------------------
   11. CLASSIFICAÇÃO (coração do jogo)
   --------------------------------------------------------- */
function classificar(catId){
  if (estado.travado || !estado.itemAtual) return;

  estado.travado = true;
  pararTimer();

  const item       = estado.itemAtual;
  const itemEl     = $('#item-atual');
  const acertou    = catId !== null && catId === item.cat;
  const caixaCerta = document.querySelector(`.caixa[data-cat="${item.cat}"]`);
  const caixaAlvo  = catId ? document.querySelector(`.caixa[data-cat="${catId}"]`) : null;

  /* ---------- ACERTO ---------- */
  if (acertou){
    estado.combo++;
    estado.melhorCombo = Math.max(estado.melhorCombo, estado.combo);

    const mult  = Math.min(3, 1 + Math.floor(estado.combo / 3));
    const ganho = PONTOS_BASE * mult;

    estado.pontos += ganho;
    estado.acertos++;
    estado.acertosMissao++;

    itemEl.classList.add('item--certo');
    caixaAlvo.classList.add('caixa--certo');
    adicionarChip(caixaAlvo, item);

    mostrarToast(
      mult > 1 ? `+${ganho} pontos · COMBO x${mult} 🔥` : `+${ganho} pontos ✔`,
      'certo'
    );
    tocarSom('certo');
    atualizarHud();

    setTimeout(() => {
      caixaAlvo.classList.remove('caixa--certo');
      avancarItem();
    }, 640);
    return;
  }

  /* ---------- ERRO / TEMPO ESGOTADO ---------- */
  estado.vidas--;
  estado.combo = 0;
  estado.erros++;

  itemEl.classList.add('item--errado');
  if (caixaAlvo) caixaAlvo.classList.add('caixa--errado');
  caixaCerta.classList.add('caixa--revelar');

  mostrarToast(
    catId === null ? '⏰ Tempo esgotado!' : '❌ Ops! Não é essa caixa.',
    'errado'
  );
  tocarSom('errado');
  atualizarHud();

  setTimeout(() => {
    caixaCerta.classList.remove('caixa--revelar');
    if (estado.vidas <= 0){
      finalizarJogo(false);
    } else {
      avancarItem();
    }
  }, 1250);
}

function avancarItem(){
  estado.itemIndex++;
  estado.selecionado = false;
  proximoItem();
}

/* ---------------------------------------------------------
   12. CLIQUE NA CAIXA (modo "toque e toque")
   --------------------------------------------------------- */
function aoClicarCaixa(catId){
  if (estado.travado || !estado.itemAtual) return;

  if (!estado.selecionado){
    mostrarToast('Primeiro escolha um item da esteira 👇', 'info');
    return;
  }

  estado.selecionado = false;
  $('#item-atual').classList.remove('item--selecionado');
  classificar(catId);
}

/* ---------------------------------------------------------
   13. ARRASTAR E SOLTAR (Pointer Events — mouse + toque)
   --------------------------------------------------------- */
function caixaEm(x, y){
  const caixas = $$('.caixa');
  for (const c of caixas){
    const r = c.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return c;
  }
  return null;
}

function realcarCaixa(x, y){
  const alvo = caixaEm(x, y);
  $$('.caixa').forEach(c => c.classList.toggle('caixa--over', c === alvo));
}

function limparRealce(){
  $$('.caixa').forEach(c => c.classList.remove('caixa--over'));
}

function configurarArrasto(){
  const itemEl = $('#item-atual');

  let pointerId = null;
  let startX = 0, startY = 0;
  let arrastando = false;
  let moveu = false;

  itemEl.addEventListener('pointerdown', (e) => {
    if (estado.travado || !estado.itemAtual) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    arrastando = true;
    moveu = false;

    try { itemEl.setPointerCapture(pointerId); } catch (_) {}
    itemEl.classList.add('item--arrastando');
    e.preventDefault();
  });

  itemEl.addEventListener('pointermove', (e) => {
    if (!arrastando) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!moveu && Math.hypot(dx, dy) > 8){
      moveu = true;
      estado.selecionado = false;
      itemEl.classList.remove('item--selecionado');
    }

    if (moveu){
      itemEl.style.transform =
        `translate(${dx}px, ${dy}px) scale(1.05) rotate(-2deg)`;
      realcarCaixa(e.clientX, e.clientY);
    }
  });

  itemEl.addEventListener('pointerup', (e) => {
    if (!arrastando) return;
    arrastando = false;

    itemEl.classList.remove('item--arrastando');
    try { itemEl.releasePointerCapture(pointerId); } catch (_) {}
    pointerId = null;

    if (moveu){
      const alvo = caixaEm(e.clientX, e.clientY);
      limparRealce();

      if (alvo){
        itemEl.style.transform = '';
        classificar(alvo.dataset.cat);
      } else {
        /* volta suavemente para a esteira */
        itemEl.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
        itemEl.style.transform = '';
        setTimeout(() => { itemEl.style.transition = ''; }, 320);
      }
    } else {
      /* foi apenas um toque: seleciona o item */
      estado.selecionado = !estado.selecionado;
      itemEl.classList.toggle('item--selecionado', estado.selecionado);
      if (estado.selecionado){
        mostrarToast('Agora toque na caixa certa 👆', 'info');
      }
    }
  });

  itemEl.addEventListener('pointercancel', () => {
    if (!arrastando) return;
    arrastando = false;
    moveu = false;
    pointerId = null;
    itemEl.classList.remove('item--arrastando');
    itemEl.style.transform = '';
    limparRealce();
  });
}

/* ---------------------------------------------------------
   14. FIM DE MISSÃO E FIM DE JOGO
   --------------------------------------------------------- */
function preencherGrid(el, dados){
  el.innerHTML = dados.map(d => `
    <div class="mini-stat">
      <span>${d.valor}</span>
      <small>${d.rotulo}</small>
    </div>
  `).join('');
}

function fimDaMissao(){
  pararTimer();
  estado.travado   = true;
  estado.itemAtual = null;

  const missao = MISSOES[estado.missaoIndex];
  const bonus  = estado.acertosMissao * BONUS_MISSAO;
  estado.pontos += bonus;
  atualizarHud();

  const ultima = estado.missaoIndex === MISSOES.length - 1;

  $('#missao-emblema').textContent = ultima ? '🎖️' : '✅';
  $('#missao-resultado-titulo').textContent = `${missao.titulo} concluída!`;
  $('#missao-resultado-texto').textContent =
    `Você classificou corretamente ${estado.acertosMissao} de ${estado.itensMissao.length} itens.`;

  preencherGrid($('#missao-resultado-grid'), [
    { valor: `${estado.acertosMissao}/${estado.itensMissao.length}`, rotulo: 'acertos na missão' },
    { valor: `+${bonus}`,                                            rotulo: 'bônus de missão' },
    { valor: estado.pontos,                                          rotulo: 'pontos totais' }
  ]);

  const btn = $('#btn-proxima');
  btn.textContent = ultima ? 'Ver resultado final 🏁' : 'Próxima missão ➡️';
  btn.dataset.acao = ultima ? 'final' : 'proxima';

  tocarSom('info');
  mostrarTela('tela-missao');
}

function finalizarJogo(vitoria){
  pararTimer();
  estado.travado   = true;
  estado.itemAtual = null;

  const tentativas = estado.acertos + estado.erros;
  const precisao = tentativas > 0
    ? Math.round((estado.acertos / tentativas) * 100)
    : 0;

  let estrelas = 1;
  if (precisao >= 90)      estrelas = 3;
  else if (precisao >= 70) estrelas = 2;

  /* ---------- Cabeçalho ---------- */
  $('#final-emblema').textContent =
    vitoria ? (estrelas === 3 ? '🏆' : '🎉') : '💔';

  $('#final-titulo').textContent =
    vitoria ? 'Missão cumprida, cientista!' : 'Suas vidas acabaram!';

  $('#final-mensagem').textContent =
    vitoria
      ? 'Você classificou tudo como um verdadeiro pesquisador do 6º ano.'
      : 'Não desanime! Revise as categorias e tente novamente.';

  /* ---------- Estrelas (só fazem sentido na vitória) ---------- */
  const estrelasEl = $('#final-estrelas');
  if (vitoria){
    estrelasEl.style.display = '';
    estrelasEl.textContent =
      '⭐'.repeat(estrelas) + '☆'.repeat(3 - estrelas);
  } else {
    estrelasEl.style.display = 'none';
    estrelasEl.textContent = '';
  }

  /* ---------- Grade de estatísticas ---------- */
  preencherGrid($('#final-grid'), [
    { valor: estado.pontos,                     rotulo: 'pontos totais' },
    { valor: `${precisao}%`,                    rotulo: 'precisão' },
    { valor: `${estado.acertos}/${tentativas}`, rotulo: 'acertos' },
    { valor: `x${estado.melhorCombo}`,          rotulo: 'melhor combo' }
  ]);

  /* ---------- Botão de reinício ----------
     Na vitória: botão verde/amarelo padrão, texto "Jogar novamente".
     Na derrota: botão vermelho destacado com pulso, texto "Tentar de novo".
  -------------------------------------------- */
  const btn = $('#btn-reiniciar');
  if (vitoria){
    btn.classList.remove('btn--perigo');
    btn.textContent = 'Jogar novamente 🔁';
  } else {
    btn.classList.add('btn--perigo');
    btn.textContent = 'Tentar de novo 🔁';
  }

  tocarSom(vitoria ? 'certo' : 'errado');
  mostrarTela('tela-final');
}

/* ---------------------------------------------------------
   15. BOTÕES E INICIALIZAÇÃO
   --------------------------------------------------------- */
function configurarBotoes(){

  // Botão "Começar a missão"
  $('#btn-comecar').addEventListener('click', () => {
    iniciarJogo();
  });

  // Botão da tela de fim de missão (serve para "Próxima" ou "Final")
  $('#btn-proxima').addEventListener('click', (e) => {
    const acao = e.currentTarget.dataset.acao;

    if (acao === 'final'){
      finalizarJogo(true);          // vitória: concluiu as 3 missões
    } else {
      estado.missaoIndex++;
      carregarMissao();
    }
  });

  // Botão "Jogar novamente" / "Tentar de novo" da tela final
  $('#btn-reiniciar').addEventListener('click', () => {
    iniciarJogo();
  });

  // Botão de som
  $('#btn-som').addEventListener('click', () => {
    estado.som = !estado.som;
    $('#btn-som').textContent = estado.som ? '🔊' : '🔇';
    if (estado.som) tocarSom('info');
  });
}

/* ---------------------------------------------------------
   16. PONTO DE ENTRADA
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  configurarBotoes();
  configurarArrasto();
  atualizarHud();
});