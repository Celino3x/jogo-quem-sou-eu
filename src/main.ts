import { supabase } from './services/supabase';
import { Player, GameState } from './types/gameTypes';

// --- Variáveis de Estado ---
let minhaId: string = '';
let meuNome: string = '';
let salaId: string = 'sala-unica'; // Para esse exemplo, todos entram na mesma sala
let gameState: GameState = { fase: 'lobby', pergunta_atual: 0, dica_atual: 3, tempo_restante: 60, jogadores: [] };
let meuPronto: boolean = false;
let jaRespondi: boolean = false;
let temporizador: any = null;

// --- Personagens (Base da sua imagem) ---
const personagens = [
    { nome: "Abigail", dicas: ["Meu esposo se chamava Nabal.", "Fugi rapidamente e evitei uma tragédia.", "Davi me elegeu entre muitas."] },
    { nome: "Isaías", dicas: ["Meu filho se chamava Sear-Jasube.", "Respondi: 'Aqui estou! Envia-me!'.", "Minha esposa era profetisa."] },
    { nome: "Jeremias", dicas: ["Nunca me casei.", "A palavra de Deus era fogo no coração.", "Fui profeta antes de nascer."] },
    { nome: "Ana", dicas: ["Levava uma túnica ao filho todo ano.", "Eli pensou que eu estava bêbada.", "Tive 3 filhos e 2 filhas."] }
];

// --- Elementos DOM ---
const lobbyScreen = document.getElementById('lobby-screen') as HTMLDivElement;
const gameScreen = document.getElementById('game-screen') as HTMLDivElement;
const rankingScreen = document.getElementById('ranking-screen') as HTMLDivElement;
const nomeInput = document.getElementById('nome-input') as HTMLInputElement;
const entrarBtn = document.getElementById('entrar-btn') as HTMLButtonElement;
const prontoBtn = document.getElementById('pronto-btn') as HTMLButtonElement;
const lobbyPlayers = document.getElementById('lobby-players') as HTMLUListElement;
const lobbyStatus = document.getElementById('lobby-status') as HTMLDivElement;

const timerDisplay = document.getElementById('timer-display') as HTMLSpanElement;
const pontosDisplay = document.getElementById('pontos-display') as HTMLSpanElement;
const dicaNivel = document.getElementById('dica-nivel') as HTMLHeadingElement;
const dicasLista = document.getElementById('dicas-lista') as HTMLUListElement;
const botoesOpcoes = document.getElementById('botoes-opcoes') as HTMLDivElement;
const resultadoDiv = document.getElementById('resultado') as HTMLDivElement;
const esperandoMsg = document.getElementById('esperando-resposta') as HTMLDivElement;
const rankingList = document.getElementById('ranking-list') as HTMLOListElement;
const reiniciarBtn = document.getElementById('reiniciar-btn') as HTMLButtonElement;

// --- Função para entrar na sala ---
entrarBtn.onclick = async () => {
    if(!nomeInput.value) return alert("Digite seu nome!");
    meuNome = nomeInput.value;
    
    // Gera ID único (socket ou uuid)
    minhaId = crypto.randomUUID();

    // Cria ou pega o estado da sala no Supabase
    const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('id', salaId)
        .single();

    if (error && error.code !== 'PGRST116') { alert('Erro ao conectar'); return; }

    if (!data) {
        // Criar sala se não existir
        const novoEstado: GameState = { fase: 'lobby', pergunta_atual: 0, dica_atual: 3, tempo_restante: 60, jogadores: [{ id: minhaId, nome: meuNome, pontos: 0, pronto: false, respondeu: false }] };
        await supabase.from('salas').insert({ id: salaId, estado: novoEstado });
    } else {
        // Atualizar estado adicionando jogador
        const jogadoresAtualizados = [...data.estado.jogadores, { id: minhaId, nome: meuNome, pontos: 0, pronto: false, respondeu: false }];
        await supabase.from('salas').update({ estado: { ...data.estado, jogadores: jogadoresAtualizados } }).eq('id', salaId);
    }

    nomeInput.disabled = true;
    entrarBtn.disabled = true;
    prontoBtn.style.display = 'block';
    inscreverNaSala();
};

// --- Função para Marcar Pronto ---
prontoBtn.onclick = async () => {
    meuPronto = true;
    prontoBtn.disabled = true;
    prontoBtn.textContent = "Aguardando os outros...";
    await atualizarJogadorNoEstado({ pronto: true });
};

async function atualizarJogadorNoEstado(updates: Partial<Player>) {
    const { data } = await supabase.from('salas').select('estado').eq('id', salaId).single();
    if(!data) return;

    const estadoAtual: GameState = data.estado;
    const idx = estadoAtual.jogadores.findIndex(p => p.id === minhaId);
    if(idx !== -1) {
        estadoAtual.jogadores[idx] = { ...estadoAtual.jogadores[idx], ...updates };
        await supabase.from('salas').update({ estado: estadoAtual }).eq('id', salaId);
    }
}

// --- Sistema de Inscrição em Tempo Real (Ouvir mudanças) ---
function inscreverNaSala() {
    supabase.channel(salaId)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'salas', filter: `id=eq.${salaId}` }, payload => {
            const novoEstado = payload.new.estado as GameState;
            gameState = novoEstado;
            renderizarInterface();
        })
        .subscribe();
}

// --- Renderização da Interface baseada no Estado ---
function renderizarInterface() {
    const jogadores = gameState.jogadores;

    // Atualizar Lobby
    if (gameState.fase === 'lobby') {
        lobbyScreen.style.display = 'block';
        gameScreen.style.display = 'none';
        rankingScreen.style.display = 'none';
        
        lobbyPlayers.innerHTML = '';
        jogadores.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `${p.nome} ${p.pronto ? '<span class="pronto">✅ Pronto</span>' : ''}`;
            lobbyPlayers.appendChild(li);
        });

        // Verifica se todos estão prontos para iniciar
        if(jogadores.length > 0 && jogadores.every(p => p.pronto)) {
            iniciarJogo();
        }
    } 
    // Atualizar Tela do Jogo
    else if (gameState.fase === 'jogando') {
        lobbyScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        rankingScreen.style.display = 'none';
        
        const meuJogador = jogadores.find(p => p.id === minhaId);
        if (meuJogador) {
            pontosDisplay.textContent = `⭐ ${meuJogador.pontos} pts`;
            jaRespondi = meuJogador.respondeu || false;
        }

        timerDisplay.textContent = `⏱️ ${gameState.tempo_restante}s`;
        dicaNivel.textContent = `Dica Nível ${gameState.dica_atual} (Vale ${gameState.dica_atual} pontos):`;
        
        // Mostra a dica correspondente
        const p = personagens[gameState.pergunta_atual];
        dicasLista.innerHTML = '';
        // Exibe a dica baseada no nível (3 -> indice 0, 2 -> indice 1, 1 -> indice 2)
        const dicaIndex = 3 - gameState.dica_atual; 
        if(p.dicas[dicaIndex]) {
            const li = document.createElement('li');
            li.textContent = p.dicas[dicaIndex];
            dicasLista.appendChild(li);
        }

        // Se eu já respondi, bloqueia os botões e mostra mensagem de espera
        if (jaRespondi) {
            botoesOpcoes.innerHTML = '';
            esperandoMsg.style.display = 'block';
            resultadoDiv.textContent = ''; // Limpa resultado
        } else {
            esperandoMsg.style.display = 'none';
            renderizarOpcoes(p.nome);
        }
    } 
    // Atualizar Ranking
    else if (gameState.fase === 'ranking') {
        lobbyScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        rankingScreen.style.display = 'block';
        
        rankingList.innerHTML = '';
        const sorted = [...jogadores].sort((a, b) => b.pontos - a.pontos);
        sorted.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.nome} - ${p.pontos} pontos`;
            rankingList.appendChild(li);
        });
    }
}

// --- Lógica de Iniciar o Jogo ---
async function iniciarJogo() {
    const estadoInicial: GameState = {
        fase: 'jogando',
        pergunta_atual: 0,
        dica_atual: 3,
        tempo_restante: 60,
        jogadores: gameState.jogadores.map(j => ({ ...j, respondeu: false })) // Reseta estado de resposta
    };
    await supabase.from('salas').update({ estado: estadoInicial }).eq('id', salaId);
    iniciarTimer();
}

// --- Lógica do Temporizador ---
function iniciarTimer() {
    if(temporizador) clearInterval(temporizador);
    temporizador = setInterval(async () => {
        const tempoAtual = gameState.tempo_restante - 1;
        
        if (tempoAtual <= 0) {
            clearInterval(temporizador);
            // Se o tempo acabou, zera a resposta de quem não respondeu e passa pra próxima
            const jogadoresAtualizados = gameState.jogadores.map(j => {
                if(!j.respondeu) return { ...j, respondeu: true }; // Marca como respondido mesmo sem acertar (Zera na prática)
                return j;
            });
            
            const proximaPergunta = gameState.pergunta_atual + 1;
            if (proximaPergunta >= personagens.length) {
                await finalizarJogo(jogadoresAtualizados);
            } else {
                const novoEstado: GameState = { ...gameState, jogadores: jogadoresAtualizados, pergunta_atual: proximaPergunta, dica_atual: 3, tempo_restante: 60 };
                await supabase.from('salas').update({ estado: novoEstado }).eq('id', salaId);
                iniciarTimer(); // Recomeça timer
            }
        } else {
            // Atualiza o timer apenas no backend
            await supabase.from('salas').update({ estado: { ...gameState, tempo_restante: tempoAtual } }).eq('id', salaId);
        }
    }, 1000);
}

// --- Lógica de Renderizar Opções e Responder ---
function renderizarOpcoes(respostaCorreta: string) {
    botoesOpcoes.innerHTML = '';
    const nomesEmbaralhados = [...personagens.map(p => p.nome)].sort(() => Math.random() - 0.5);
    
    nomesEmbaralhados.forEach(nome => {
        const btn = document.createElement('button');
        btn.textContent = nome;
        btn.onclick = () => responder(nome, respostaCorreta, btn);
        botoesOpcoes.appendChild(btn);
    });
}

async function responder(escolha: string, correta: string, btn: HTMLButtonElement) {
    if(jaRespondi) return;
    jaRespondi = true;

    // Desabilita botões
    document.querySelectorAll('#botoes-opcoes button').forEach(b => (b as HTMLButtonElement).disabled = true);

    let pontosGanhos = 0;
    if (escolha === correta) {
        pontosGanhos = gameState.dica_atual;
        resultadoDiv.textContent = `✅ Acertou! Ganhou ${pontosGanhos} pontos.`;
        resultadoDiv.style.color = "green";
        btn.style.backgroundColor = "#aed581";
    } else {
        resultadoDiv.textContent = `❌ Errou! A resposta era ${correta}.`;
        resultadoDiv.style.color = "red";
        btn.style.backgroundColor = "#ef9a9a";
        // Marca a certa
        document.querySelectorAll('#botoes-opcoes button').forEach(b => {
            if((b as HTMLButtonElement).textContent === correta) (b as HTMLButtonElement).style.backgroundColor = "#aed581";
        });
    }

    // Atualiza estado no backend
    const jogadoresAtualizados = gameState.jogadores.map(j => {
        if(j.id === minhaId) return { ...j, pontos: j.pontos + pontosGanhos, respondeu: true };
        return j;
    });

    // Verifica se todos responderam para avançar
    const todosResponderam = jogadoresAtualizados.every(j => j.respondeu);
    if (todosResponderam) {
        clearInterval(temporizador);
        const proximaPergunta = gameState.pergunta_atual + 1;
        if (proximaPergunta >= personagens.length) {
            await finalizarJogo(jogadoresAtualizados);
        } else {
            const novoEstado: GameState = { ...gameState, jogadores: jogadoresAtualizados, pergunta_atual: proximaPergunta, dica_atual: 3, tempo_restante: 60 };
            await supabase.from('salas').update({ estado: novoEstado }).eq('id', salaId);
        }
    } else {
        await supabase.from('salas').update({ estado: { ...gameState, jogadores: jogadoresAtualizados } }).eq('id', salaId);
    }
}

async function finalizarJogo(jogadoresFinais: Player[]) {
    clearInterval(temporizador);
    const novoEstado: GameState = { ...gameState, fase: 'ranking', jogadores: jogadoresFinais };
    await supabase.from('salas').update({ estado: novoEstado }).eq('id', salaId);
}

// --- Botão Reiniciar ---
reiniciarBtn.onclick = () => {
    location.reload();
};