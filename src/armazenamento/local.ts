import { dadosVazios } from '../dominio/estoque';
import type { Dados } from '../dominio/tipos';
import { validarDados } from './backup';

export const CHAVE = 'controle-estoque:v1';

/** Nunca sobrescreve conteúdo ilegível: devolve o texto bruto para o app oferecer download. */
export function carregar(): { ok: true; dados: Dados } | { ok: false; bruto: string } {
  let bruto: string | null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    // Leitura que lança é estado ilegível, não ausência: nunca tratar como vazio.
    return { ok: false, bruto: '' };
  }
  if (bruto === null) return { ok: true, dados: dadosVazios() };
  try {
    const r = validarDados(JSON.parse(bruto));
    if (r.ok) return { ok: true, dados: r.valor };
  } catch {
    // JSON ilegível: cai no retorno abaixo
  }
  return { ok: false, bruto };
}

export function salvar(dados: Dados): boolean {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
    return true;
  } catch {
    return false;
  }
}
