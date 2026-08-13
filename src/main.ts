interface Personagem {
    nome: string;
    dicas: string[];
}

const personagens: Personagem[] = [
    {
        nome: "Abigail",
        dicas: [
            "Meu esposo se chamava Nabal, um homem rude e mau.",
            "Fugi rapidamente e evitei uma grande tragédia.",
            "Davi me elegeu entre muitas outras mulheres."
        ]
    },
    {
        nome: "Isaías",
        dicas: [
            "O meu filho se chamava Sear-Jasube.",
            "Respondi a Jeová: 'Aqui estou! Envia-me!'.",
            "Minha esposa foi chamada de 'a profetisa'."
        ]
    },
    {
        nome: "Jeremias",
        dicas: [
            "Nunca me casei.",
            "A palavra de Deus foi um fogo ardente no meu coração.",
            "Fui escolhido por Jeová para ser profeta antes de nascer."
        ]
    },
    {
        nome: "Ana",
        dicas: [
            "Todo ano levava uma túnica para meu filho.",
            "O sumo sacerdote Eli achou que eu estava bêbada.",
            "Tive três filhos e duas filhas."
        ]
    }
];

const dicasLista = document.getElementById('dicas-lista') as HTMLUListElement;
const botoesOpcoes = document.getElementById('botoes-opcoes') as HTMLDivElement;
const resultadoDiv = document.getElementById('resultado') as HTMLDivElement;
const proximoBtn = document.getElementById('proximo-btn') as HTMLButtonElement;

let personagemAtual: number = 0;
let jogoAtivo: boolean = true;

function embaralharArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function carregarPersonagem(index: number): void {
    jogoAtivo = true;
    resultadoDiv.textContent = "";
    resultadoDiv.style.color = "black";
    proximoBtn.style.display = "none";
    
    const p = personagens[index];
    
    dicasLista.innerHTML = "";
    p.dicas.forEach(dica => {
        const li = document.createElement('li');
        li.textContent = dica;
        dicasLista.appendChild(li);
    });

    botoesOpcoes.innerHTML = "";
    const nomesEmbaralhados: string[] = embaralharArray(personagens.map(p => p.nome));
    
    nomesEmbaralhados.forEach(nome => {
        const btn = document.createElement('button');
        btn.textContent = nome;
        btn.className = 'opcao-btn';
        btn.onclick = () => verificarResposta(nome, btn);
        botoesOpcoes.appendChild(btn);
    });
}

function verificarResposta(nomeEscolhido: string, botaoClicado: HTMLButtonElement): void {
    if (!jogoAtivo) return;
    jogoAtivo = false;

    const correto: string = personagens[personagemAtual].nome;

    const todosBotoes = document.querySelectorAll('.opcao-btn') as NodeListOf<HTMLButtonElement>;
    todosBotoes.forEach(btn => btn.disabled = true);

    if (nomeEscolhido === correto) {
        resultadoDiv.textContent = "✅ Parabéns! Você acertou!";
        resultadoDiv.style.color = "#2e7d32";
        botaoClicado.style.backgroundColor = "#aed581";
    } else {
        resultadoDiv.textContent = `❌ Que pena! A resposta correta era ${correto}.`;
        resultadoDiv.style.color = "#c62828";
        botaoClicado.style.backgroundColor = "#ef9a9a";
        
        todosBotoes.forEach(btn => {
            if(btn.textContent === correto) {
                btn.style.backgroundColor = "#aed581";
            }
        });
    }

    if (personagemAtual < personagens.length - 1) {
        proximoBtn.style.display = "block";
    } else {
        resultadoDiv.textContent += " (Fim do jogo!)";
    }
}

proximoBtn.onclick = () => {
    personagemAtual++;
    carregarPersonagem(personagemAtual);
};

carregarPersonagem(0);