'use strict';

const $ = (id) => document.getElementById(id);
// Timeout evita deixar a interface esperando indefinidamente por uma API.
async function buscarJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const resposta = await fetch(url, { signal: controller.signal });
    if (!resposta.ok) throw new Error('Falha na consulta');
    return await resposta.json();
  } finally {
    clearTimeout(timeout);
  }
}

let cotacoes = null;
const dinheiro = (valor, moeda) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(valor);
function simular() {
  const valor = Number($('valor').value);
  const valido = $('valor').validity.valid && valor > 0 && valor <= 1000000;
  $('valor').setAttribute('aria-invalid', String(!valido));
  $('valor-erro').textContent = valido ? '' : 'Informe um valor entre R$ 0,01 e R$ 1.000.000,00, com até duas casas decimais.';
  $('impacto').textContent = valido ? `Com ${dinheiro(valor, 'BRL')}, seria possível apoiar o plantio de ${Math.floor(valor / 5)} muda(s).` : 'Corrija o valor para simular.';
  const moeda = $('moeda').value;
  $('conversao').textContent = valido && cotacoes ? `Equivalente aproximado: ${dinheiro(valor / Number(cotacoes[`${moeda}BRL`].bid), moeda)}.` : '';
  if (cotacoes) {
    const item = cotacoes[`${moeda}BRL`];
    $('cotacao-status').textContent = `Fonte: AwesomeAPI · 1 ${moeda} = ${dinheiro(Number(item.bid), 'BRL')} · Cotação de ${new Date(Number(item.timestamp) * 1000).toLocaleString('pt-BR')}.`;
  }
}
async function atualizarCotacao() {
  const botao = $('atualizar-cotacao');
  botao.disabled = true;
  cotacoes = null;
  simular();
  $('cotacao-status').textContent = 'Consultando cotação…';
  try {
    const dados = await buscarJSON('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
    for (const chave of ['USDBRL', 'EURBRL']) {
      if (!Number.isFinite(Number(dados[chave]?.bid)) || Number(dados[chave].bid) <= 0 || !Number.isFinite(Number(dados[chave].timestamp)) || Number(dados[chave].timestamp) <= 0) throw new Error('Cotação inválida');
    }
    cotacoes = dados;
    simular();
  } catch {
    $('cotacao-status').textContent = 'Cotação indisponível. O cálculo de mudas continua funcionando. Tente atualizar novamente.';
  } finally {
    botao.disabled = false;
  }
}
$('valor').addEventListener('input', simular);
$('moeda').addEventListener('change', simular);
$('atualizar-cotacao').addEventListener('click', atualizarCotacao);
simular();
atualizarCotacao();

// Validação em tempo real e inscrição apenas demonstrativa.
const formulario = $('form-voluntario');
const obrigatorios = [...formulario.querySelectorAll('[required]')];
const estados = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
for (const estado of estados) $('uf').add(new Option(estado, estado));
function validar(campo) {
  let mensagem = '';
  if (!campo.value.trim()) mensagem = 'Preencha este campo.';
  else if (campo.id === 'nome' && campo.value.trim().length < 3) mensagem = 'Informe pelo menos 3 caracteres.';
  else if (!campo.validity.valid) mensagem = campo.id === 'email' ? 'Informe um e-mail válido.' : campo.id === 'cep' ? 'Informe um CEP com 8 dígitos.' : 'Confira o valor informado.';
  campo.setAttribute('aria-invalid', String(Boolean(mensagem)));
  $(`${campo.id}-erro`).textContent = mensagem;
  return !mensagem;
}
for (const campo of obrigatorios) {
  campo.addEventListener('input', () => validar(campo));
  campo.addEventListener('blur', () => validar(campo));
}
formulario.addEventListener('input', () => { $('form-status').textContent = ''; });
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const resultados = obrigatorios.map(validar);
  if (resultados.includes(false)) {
    obrigatorios[resultados.indexOf(false)].focus();
    $('form-status').textContent = 'Confira os campos indicados antes de continuar.';
    return;
  }
  $('form-status').textContent = `Tudo certo, ${$('nome').value.trim()}! Sua inscrição em ${$('interesse').value.toLowerCase()} foi validada nesta demonstração. Nenhum cadastro foi enviado ou salvo.`;
});

let consultaAtual = 0;
let temporizadorCEP;
const camposEndereco = ['rua', 'bairro', 'cidade', 'uf'];
$('cep').addEventListener('input', () => {
  clearTimeout(temporizadorCEP);
  const versao = ++consultaAtual;
  const cep = $('cep').value.replace(/\D/g, '').slice(0, 8);
  $('cep').value = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
  validar($('cep'));
  for (const id of camposEndereco) {
    $(id).value = '';
    $(id).removeAttribute('aria-invalid');
    if ($(`${id}-erro`)) $(`${id}-erro`).textContent = '';
  }
  $('cep-status').textContent = 'Digite os 8 dígitos do CEP ou preencha o endereço manualmente.';
  if (cep.length !== 8) return;
  temporizadorCEP = setTimeout(async () => {
    // Não sobrescrever edições manuais realizadas durante a consulta.
    const anteriores = camposEndereco.map((id) => $(id).value);
    $('cep-status').textContent = 'Buscando endereço…';
    try {
      const dados = await buscarJSON(`https://viacep.com.br/ws/${cep}/json/`);
      if (versao !== consultaAtual) return;
      if (dados.erro || !dados.localidade || !estados.includes(dados.uf)) {
        $('cep-status').textContent = 'CEP não encontrado. Confira o CEP ou preencha o endereço manualmente.';
        return;
      }
      const valores = [dados.logradouro || '', dados.bairro || '', dados.localidade, dados.uf];
      camposEndereco.forEach((id, indice) => {
        if ($(id).value === anteriores[indice]) $(id).value = valores[indice];
        if ($(id).required) validar($(id));
      });
      $('cep-status').textContent = 'Consulta concluída pelo ViaCEP. Confira e complete o endereço, se necessário.';
    } catch {
      if (versao === consultaAtual) $('cep-status').textContent = 'Não foi possível consultar o ViaCEP. Preencha o endereço manualmente ou altere o CEP para tentar novamente.';
    }
  }, 450);
});

// Leaflet 1.9.4: pontos públicos ilustrativos, sem indicar uma sede real.
const locais = [
  { nome: 'Campo Grande', coordenadas: [-12.9925, -38.5234], descricao: 'Exemplo de ponto para uma oficina de educação ambiental.' },
  { nome: 'Dique do Tororó', coordenadas: [-12.9857, -38.5105], descricao: 'Exemplo de espaço para uma ação de conscientização.' }
];
if (typeof L === 'undefined') {
  $('mapa-status').textContent = 'O mapa não carregou. Use o link do OpenStreetMap abaixo.';
  document.querySelectorAll('[data-local]').forEach((botao) => { botao.disabled = true; });
} else {
  const mapa = L.map('mapa', { scrollWheelZoom: false }).setView([-12.989, -38.517], 14);
  const camada = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapa);
  camada.on('tileerror', () => { $('mapa-status').textContent = 'Algumas imagens do mapa não carregaram. Você pode usar o link abaixo.'; });
  const marcadores = locais.map((local) => L.marker(local.coordenadas).addTo(mapa).bindPopup(`<strong>${local.nome}</strong><br>${local.descricao}<br>Local demonstrativo.`));
  document.querySelectorAll('[data-local]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const indice = Number(botao.dataset.local);
      mapa.setView(locais[indice].coordenadas, 16);
      marcadores[indice].openPopup();
      $('mapa-status').textContent = `${locais[indice].nome}: ${locais[indice].descricao} Local demonstrativo.`;
    });
  });
}
