import { MAX_QUANTIDADE_MIL, type Unidade } from './tipos';

/** Inteiro escalado por 10^casas, ou null se vazio, inválido, negativo ou com mais casas que o permitido. Valores além do inteiro seguro saturam em MAX_SAFE_INTEGER. */
export function parseDecimal(texto: string, casas: number): number | null {
  let t = texto.trim();
  if (t.includes(',')) {
    // Com vírgula decimal, o ponto só vale como separador de milhar, em grupos de três dígitos.
    const partes = t.split(',');
    if (partes.length !== 2 || !/^(\d+|\d{1,3}(\.\d{3})+)$/.test(partes[0])) return null;
    t = `${partes[0].replace(/\./g, '')}.${partes[1]}`;
  }
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [inteira, decimal = ''] = t.split('.');
  if (decimal.length > casas) return null;
  const valor = Number(inteira + decimal.padEnd(casas, '0'));
  // Número bem formado, porém grande demais para ser exato: satura para o domínio dizer "Valor muito alto".
  return Number.isSafeInteger(valor) ? valor : Number.MAX_SAFE_INTEGER;
}

export function parsePreco(texto: string): number | null {
  return parseDecimal(texto, 2);
}

export function parseQuantidade(texto: string, unidade: Unidade): number | null {
  const mil = parseDecimal(texto, unidade === 'un' ? 0 : 3);
  if (mil === null) return null;
  if (unidade !== 'un') return mil;
  // Acima do limite devolve o menor múltiplo de 1000 acima dele, sem perder precisão no produto.
  return mil > MAX_QUANTIDADE_MIL / 1000 ? MAX_QUANTIDADE_MIL + 1000 : mil * 1000;
}

/** 1500,3 -> "1,5"; 2000,3 -> "2"; 2890,2 -> "28,90" */
export function numeroParaTexto(valor: number, casas: number): string {
  const base = 10 ** casas;
  const inteira = Math.floor(valor / base);
  let decimal = String(valor % base).padStart(casas, '0');
  if (casas === 3) decimal = decimal.replace(/0+$/, '');
  return decimal ? `${inteira},${decimal}` : String(inteira);
}

export function formatarQuantidade(mil: number, unidade: Unidade): string {
  return `${numeroParaTexto(mil, 3)} ${unidade}`;
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarPreco(centavos: number): string {
  return moeda.format(centavos / 100).replace(/ /g, ' ');
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
