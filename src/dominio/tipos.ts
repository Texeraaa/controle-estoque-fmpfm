export type Unidade = 'un' | 'kg' | 'L';
export type MotivoSaida = 'venda' | 'perda' | 'ajuste';

export interface Produto {
  id: string; // crypto.randomUUID()
  nome: string; // obrigatório, único
  categoria: string; // texto livre, pode ser vazio
  precoCentavos: number; // inteiro >= 0
  unidade: Unidade; // definida na criação, não editável depois
  quantidadeMil: number; // saldo em milésimos, inteiro >= 0
  estoqueMinimoMil: number; // em milésimos, inteiro >= 0
  criadoEm: string; // ISO 8601
  atualizadoEm: string; // ISO 8601
}

export interface Movimentacao {
  id: string;
  produtoId: string;
  tipo: 'entrada' | 'saida';
  quantidadeMil: number; // inteiro > 0
  motivo?: MotivoSaida; // só em saídas; padrão 'venda'
  observacao?: string;
  saldoAposMil: number; // saldo do produto logo após esta movimentação
  criadaEm: string; // ISO 8601, automática
}

export interface Dados {
  versao: 1;
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  ultimoBackupEm?: string;
}

export type Resultado<T, E = string> = { ok: true; valor: T } | { ok: false; erro: E };

export const UNIDADES: Unidade[] = ['un', 'kg', 'L'];
export const MAX_QUANTIDADE_MIL = 1_000_000_000;
export const MAX_PRECO_CENTAVOS = 100_000_000;
export const MAX_NOME = 80;
