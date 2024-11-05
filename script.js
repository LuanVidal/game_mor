let perguntas = [];
let perguntasSelecionadas = [];
let perguntaAtual = 0;
let pontuacao = 0;
let tempoRestante = 300; // 5 minutos em segundos
let nomeJogador = "";
let intervalo;
let respostaSelecionada = null;

async function carregarPerguntas() {
  const response = await fetch("perguntas.json");
  perguntas = await response.json();
  // Seleciona até 10 perguntas ou todas as disponíveis, se menos de 10
  perguntasSelecionadas = perguntas.sort(() => 0.5 - Math.random()).slice(0, Math.min(10, perguntas.length));
}

function iniciarJogo() {
  nomeJogador = document.getElementById("nome").value;
  if (!nomeJogador) {
    alert("Por favor, insira seu nome.");
    return;
  }
  document.getElementById("inicio").classList.add("d-none");
  document.getElementById("jogo").classList.remove("d-none");
  document.getElementById("nomeParticipante").textContent = `Jogador: ${nomeJogador}`;
  carregarPerguntas().then(() => {
    exibirPergunta();
    iniciarTimer();
  });
}

function exibirPergunta() {
  respostaSelecionada = null; // Resetar a seleção de resposta ao exibir uma nova pergunta
  const pergunta = perguntasSelecionadas[perguntaAtual];
  document.getElementById("pergunta").textContent = pergunta.pergunta;
  document.getElementById("respostas").innerHTML = "";

  pergunta.respostas.forEach((resposta, index) => {
    const item = document.createElement("button");
    item.classList.add("list-group-item", "list-group-item-action");
    item.textContent = resposta;
    item.onclick = () => selecionarResposta(index, item);
    document.getElementById("respostas").appendChild(item);
  });
}

function selecionarResposta(index, item) {
  respostaSelecionada = index;

  // Remove a seleção de outros itens e destaca o item selecionado
  document.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
  item.classList.add("active");
}

function confirmarResposta() {
  if (respostaSelecionada === null) {
    alert("Por favor, selecione uma resposta antes de confirmar.");
    return;
  }

  const pergunta = perguntasSelecionadas[perguntaAtual];
  if (respostaSelecionada === pergunta.correta) {
    pontuacao += Math.floor(tempoRestante / 10); // Pontuação baseada no tempo
  }

  // Verifica se é a última pergunta no array `perguntasSelecionadas`
  if (perguntaAtual === perguntasSelecionadas.length - 1) { 
    finalizarJogo(); // Se for a última pergunta, finaliza o jogo
  } else { 
    perguntaAtual++; // Caso contrário, vai para a próxima pergunta
    exibirPergunta();
  }
}

function iniciarTimer() {
  intervalo = setInterval(() => {
    tempoRestante--;
    const minutos = String(Math.floor(tempoRestante / 60)).padStart(2, "0");
    const segundos = String(tempoRestante % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `Tempo: ${minutos}:${segundos}`;
    if (tempoRestante <= 0) {
      finalizarJogo();
    }
  }, 1000);
}

function finalizarJogo() {
  clearInterval(intervalo);
  document.getElementById("jogo").classList.add("d-none");
  document.getElementById("final").classList.remove("d-none");
  document.getElementById("pontuacaoFinal").textContent = `Sua pontuação: ${pontuacao}`;
  atualizarRanking();
}

function atualizarRanking() {
  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push({ nome: nomeJogador, pontuacao });
  ranking.sort((a, b) => b.pontuacao - a.pontuacao);
  localStorage.setItem("ranking", JSON.stringify(ranking.slice(0, 10))); // Top 10
  document.getElementById("ranking").innerHTML = ranking.map((item) => `<li>${item.nome}: ${item.pontuacao}</li>`).join("");
}

function reiniciar() {
  perguntaAtual = 0;
  pontuacao = 0;
  tempoRestante = 300;
  respostaSelecionada = null;
  document.getElementById("final").classList.add("d-none");
  document.getElementById("inicio").classList.remove("d-none");
}
