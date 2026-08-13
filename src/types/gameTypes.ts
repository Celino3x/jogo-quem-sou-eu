export interface Player {
    id: string;
    nome: string;
    pontos: number;
    pronto: boolean;
    respondeu: boolean; // Para saber se já respondeu na rodada atual
}

export interface GameState {
    fase: 'lobby' | 'jogando' | 'ranking';
    pergunta_atual: number;
    dica_atual: number; // 3, 2 ou 1 (equivale aos pontos)
    tempo_restante: number;
    jogadores: Player[];
}