import * as supabase from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://pzmoiyspdnmkaqxhtfme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bW9peXNwZG5ta2FxeGh0Zm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNjQ1OTgsImV4cCI6MjA0Njk0MDU5OH0.neJztxfZKsJxjGP0XD_m3rJ1UKnz5G7uKoG8WR2MEWk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let perguntas = [];
let perguntasSelecionadas = [];
let perguntaAtual = 0;
let pontuacao = 0;
let tempoRestante = 300; // 5 minutos em segundos
let nomeJogador = "";
let intervalo;
let respostaSelecionada = null;
let perguntasRespondidas = 0; // Contador para rastrear perguntas respondidas

// Carregar perguntas do arquivo JSON
async function carregarPerguntas() {
  const response = await fetch("./perguntas.json");
  perguntas = await response.json();
  perguntasSelecionadas = perguntas.sort(() => 0.5 - Math.random()).slice(0, Math.min(10, perguntas.length));
}

// Função para iniciar o jogo
function iniciarJogo() {
  // Captura o valor do campo de nome
  nomeJogador = document.getElementById("nome").value.trim();

  // Verifica se o nome foi inserido
  if (!nomeJogador) {
    alert("Por favor, insira seu nome.");
    return;
  }

  // Esconde a tela de início e exibe a tela do jogo
  document.getElementById("inicio").classList.add("d-none");
  document.getElementById("jogo").classList.remove("d-none");

  // Exibe o nome do jogador na tela

  // Armazena o estado do jogo no localStorage
  localStorage.setItem("estado", "jogo");

  // Carrega as perguntas e inicia o timer
  carregarPerguntas().then(() => {
    exibirPergunta();
    iniciarTimer();
  });
}

// Exibir a pergunta atual
function exibirPergunta() {
  respostaSelecionada = null;
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

// Selecionar uma resposta
function selecionarResposta(index, item) {
  respostaSelecionada = index;
  document.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
  item.classList.add("active");
}

// Confirmar a resposta escolhida
function confirmarResposta() {
  if (respostaSelecionada === null) {
    alert("Por favor, selecione uma resposta antes de confirmar.");
    return;
  }

  perguntasRespondidas++; // Incrementa o contador de perguntas respondidas

  const pergunta = perguntasSelecionadas[perguntaAtual];
  if (respostaSelecionada === pergunta.correta) {
    pontuacao += Math.floor((tempoRestante + Math.random() * 50) * 20); // Ajuste para valores maiores
  }

  if (perguntaAtual === perguntasSelecionadas.length - 1) {
    finalizarJogo();
  } else {
    perguntaAtual++;
    exibirPergunta();
  }
}

// Iniciar o timer do jogo
function iniciarTimer() {
  intervalo = setInterval(() => {
    tempoRestante--;
    const minutos = String(Math.floor(tempoRestante / 60)).padStart(2, "0");
    const segundos = String(tempoRestante % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${minutos}:${segundos}`;
    if (tempoRestante <= 0) {
      finalizarJogo(); // Tempo esgotado, leva para a tela de resultado
    }
  }, 1000);
}

// Função para finalizar o jogo
function finalizarJogo() {
  clearInterval(intervalo);
  document.getElementById("jogo").classList.add("d-none");
  document.getElementById("final").classList.remove("d-none");
  pontuacao = Math.floor(pontuacao / perguntasRespondidas || 0); // Ajusta pontuação média se houver respostas
  document.getElementById("pontuacaoFinal").textContent = `Sua pontuação: ${pontuacao}`;
  salvarPontuacao();
  localStorage.setItem("estado", "ranking");
}

// Salvar a pontuação do jogador no Supabase
async function salvarPontuacao() {
  const ranking = { nome: nomeJogador, pontuacao };
  const { data, error } = await supabaseClient
    .from('ranking')
    .insert([ranking]);

  if (error) {
    console.error('Erro ao salvar a pontuação:', error);
  } else {
    console.log('Pontuação salva com sucesso:', data);
    atualizarRanking(); // Atualiza imediatamente o ranking após salvar
  }
}

// Buscar e exibir o ranking atualizado do Supabase
async function atualizarRanking() {
  // Busca os dados do ranking no Supabase
  const { data: rankingData, error } = await supabaseClient
    .from('ranking')
    .select('*')
    .order('pontuacao', { ascending: false })
    .limit(10); // Limita a consulta aos 10 primeiros

  if (error) {
    console.error('Erro ao buscar o ranking:', error);
    return;
  }

  // Atualiza os nomes e pontuações no pódio
  document.getElementById("primeiroLugar").innerText = `${rankingData[0]?.nome || "N/A"}: ${rankingData[0]?.pontuacao || "0"}`;
  document.getElementById("segundoLugar").innerText = `${rankingData[1]?.nome || "N/A"}: ${rankingData[1]?.pontuacao || "0"}`;
  document.getElementById("terceiroLugar").innerText = `${rankingData[2]?.nome || "N/A"}: ${rankingData[2]?.pontuacao || "0"}`;

  // Adiciona margem entre o pódio e a lista
  document.getElementById("ranking").style.marginTop = "20px"; 

  // Atualiza a lista para os 4º ao 10º lugares
  const rankingList = document.getElementById("ranking");
  rankingList.innerHTML = rankingData
    .slice(3, 10) // Seleciona os participantes do 4º ao 10º lugar
    .map((item, index) => `<li>${index + 4}º ${item.nome}: ${item.pontuacao}</li>`) // Adiciona a posição e a pontuação
    .join("");

}

// Restaurar o estado da página
function restaurarEstado() {
  const estado = localStorage.getItem("estado");
  if (estado === "ranking") {
    document.getElementById("inicio").classList.add("d-none");
    document.getElementById("final").classList.remove("d-none");
    atualizarRanking();
  }
}

// Iniciar a assinatura em tempo real para o ranking
function iniciarAssinaturaRanking() {
  supabaseClient
    .channel('public:ranking')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ranking' },
      () => {
        atualizarRanking();
        location.reload();  // Recarrega a página automaticamente
      }
    )
    .subscribe();
}

// Inicializar o jogo
document.addEventListener("DOMContentLoaded", () => {
  restaurarEstado();
  iniciarAssinaturaRanking();
});

// Reiniciar o jogo
function reiniciar() {
  perguntaAtual = 0;
  pontuacao = 0;
  tempoRestante = 300;
  perguntasRespondidas = 0; // Reseta as perguntas respondidas
  respostaSelecionada = null;
  document.getElementById("final").classList.add("d-none");
  document.getElementById("inicio").classList.remove("d-none");
  localStorage.setItem("estado", "inicio");
}


document.querySelectorAll('.list-group-item').forEach(item => {
  item.addEventListener('click', function () {
    // Remova as classes "correct" e "incorrect" de todas as alternativas
    document.querySelectorAll('.list-group-item').forEach(option => {
      option.classList.remove('correct', 'incorrect');
    });

    // Adiciona a classe "correct" ou "incorrect" dependendo da escolha
    if (this.dataset.correct === "true") {
      this.classList.add('correct');
    } else {
      this.classList.add('incorrect');
    }
  });
});

// Tornar funções acessíveis ao escopo global
window.iniciarJogo = iniciarJogo;
window.confirmarResposta = confirmarResposta;
window.reiniciar = reiniciar;
