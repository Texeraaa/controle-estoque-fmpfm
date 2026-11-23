import type { Unidade } from './tipos';

/** Inteiro escalado por 10^casas, ou null se vazio, inválido, negativo ou com mais casas que o permitido. */
export function parseDecimal(texto: string, casas: number): number | null {
  let t = texto.trim();
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [inteira, decimal = ''] = t.split('.');
  if (decimal.length > casas) return null;
  const valor = Number(inteira + decimal.padEnd(casas, '0'));
  return Number.isSafeInteger(valor) ? valor : null;
}

export function parsePreco(texto: string): number | null {
  return parseDecimal(texto, 2);
}

export function parseQuantidade(texto: string, unidade: Unidade): number | null {
  const mil = parseDecimal(texto, unidade === 'un' ? 0 : 3);
  if (mil === null) return null;
  return unidade === 'un' ? mil * 1000 : mil;
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
