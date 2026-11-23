import { emAlerta, filtrarProdutos, valorEmEstoqueCentavos } from '../dominio/estoque';
import { numeroParaTexto } from '../dominio/numeros';
import type { Dados } from '../dominio/tipos';
import { dataLocal } from './backup';

const CABECALHO = ['Nome', 'Categoria', 'Unidade', 'Quantidade', 'Estoque mínimo', 'Preço', 'Valor em estoque', 'Situação'];

/** Campo de texto: neutraliza fórmulas do Excel e aplica aspas quando preciso. */
function campoTexto(texto: string): string {
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

export function gerarCsv(
  dados: Dados,
  agora: string = new Date().toISOString(),
): { nomeArquivo: string; conteudo: string } {
  const linhas = filtrarProdutos(dados.produtos, '', false).map((p) =>
    [
      campoTexto(p.nome),
      campoTexto(p.categoria),
      p.unidade,
      numeroParaTexto(p.quantidadeMil, 3),
      numeroParaTexto(p.estoqueMinimoMil, 3),
      numeroParaTexto(p.precoCentavos, 2),
      numeroParaTexto(valorEmEstoqueCentavos(p), 2),
      emAlerta(p) ? 'baixo' : 'ok',
    ].join(';'),
  );
  return {
    nomeArquivo: `estoque-${dataLocal(agora)}.csv`,
    conteudo: '\uFEFF' + [CABECALHO.join(';'), ...linhas].join('\r\n'),
  };
}
