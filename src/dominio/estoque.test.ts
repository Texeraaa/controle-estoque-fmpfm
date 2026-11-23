import { describe, expect, it } from 'vitest';
import {
  categorias, contarMovimentacoes, criarProduto, dadosVazios, editarProduto, emAlerta,
  excluirProduto, filtrarMovimentacoes, filtrarProdutos, registrarEntrada, registrarSaida,
  resumo, valorEmEstoqueCentavos, type EntradaProduto,
} from './estoque';
import type { Dados, Produto, Resultado } from './tipos';

function ok<T, E>(r: Resultado<T, E>): T {
  if (!r.ok) throw new Error('esperava ok: ' + JSON.stringify(r.erro));
  return r.valor;
}
function erro<T, E>(r: Resultado<T, E>): E {
  if (r.ok) throw new Error('esperava erro');
  return r.erro;
}

const arroz: EntradaProduto = {
  nome: 'Arroz 5 kg', categoria: 'Mercearia', precoCentavos: 2890,
  unidade: 'un', quantidadeMil: 2000, estoqueMinimoMil: 5000,
};
function base(): { d: Dados; id: string } {
  const d = ok(criarProduto(dadosVazios(), arroz));
  return { d, id: d.produtos[0].id };
}
const prod = (q: number, min: number): Produto => ({
  id: 'x', nome: 'x', categoria: '', precoCentavos: 0, unidade: 'kg',
  quantidadeMil: q, estoqueMinimoMil: min, criadoEm: '', atualizadoEm: '',
});

describe('cadastro', () => {
  it('cria produto válido com nome aparado', () => {
    const d = ok(criarProduto(dadosVazios(), { ...arroz, nome: '  Arroz 5 kg ' }));
    expect(d.produtos[0]).toMatchObject({ nome: 'Arroz 5 kg', quantidadeMil: 2000 });
  });
  it('recusa nome vazio', () => {
    expect(criarProduto(dadosVazios(), { ...arroz, nome: '   ' })).toEqual({
      ok: false, erro: { nome: 'Informe o nome do produto.' },
    });
  });
  it('recusa nome com mais de 80 caracteres', () => {
    expect(erro(criarProduto(dadosVazios(), { ...arroz, nome: 'a'.repeat(81) })).nome)
      .toBe('O nome pode ter no máximo 80 caracteres.');
    expect(criarProduto(dadosVazios(), { ...arroz, nome: 'a'.repeat(80) }).ok).toBe(true);
  });
  it('recusa nome duplicado sem diferenciar caixa', () => {
    const { d } = base();
    expect(erro(criarProduto(d, { ...arroz, nome: 'ARROZ 5 KG ' })).nome).toBe('Já existe um produto com esse nome.');
  });
  it('recusa preço negativo ou não inteiro', () => {
    expect(erro(criarProduto(dadosVazios(), { ...arroz, precoCentavos: -1 })).preco).toBe('Informe um valor válido.');
    expect(erro(criarProduto(dadosVazios(), { ...arroz, precoCentavos: 1.5 })).preco).toBe('Informe um valor válido.');
  });
  it('recusa decimal em un', () => {
    const e = erro(criarProduto(dadosVazios(), { ...arroz, quantidadeMil: 1500, estoqueMinimoMil: 500 }));
    expect(e.quantidade).toBe('Para unidade "un", use números inteiros.');
    expect(e.estoqueMinimo).toBe('Para unidade "un", use números inteiros.');
  });
  it('aceita decimal em kg', () => {
    expect(criarProduto(dadosVazios(), { ...arroz, unidade: 'kg', quantidadeMil: 1500 }).ok).toBe(true);
  });
  it('recusa valores acima do limite', () => {
    expect(erro(criarProduto(dadosVazios(), { ...arroz, quantidadeMil: 999_999_999_999_000 })).quantidade).toBe('Valor muito alto.');
    expect(erro(criarProduto(dadosVazios(), { ...arroz, estoqueMinimoMil: 1_000_001_000 })).estoqueMinimo).toBe('Valor muito alto.');
    expect(erro(criarProduto(dadosVazios(), { ...arroz, precoCentavos: 100_000_001 })).preco).toBe('Valor muito alto.');
  });
  it('devolve todos os erros de uma vez', () => {
    const e = erro(criarProduto(dadosVazios(), { ...arroz, nome: '', precoCentavos: -1, quantidadeMil: -5, estoqueMinimoMil: -5 }));
    expect(Object.keys(e).sort()).toEqual(['estoqueMinimo', 'nome', 'preco', 'quantidade']);
  });
});

describe('estoque inicial', () => {
  it('gera movimentação de entrada', () => {
    const { d } = base();
    expect(d.movimentacoes).toEqual([
      expect.objectContaining({ tipo: 'entrada', quantidadeMil: 2000, observacao: 'Estoque inicial', saldoAposMil: 2000 }),
    ]);
  });
  it('não gera movimentação com quantidade zero', () => {
    expect(ok(criarProduto(dadosVazios(), { ...arroz, quantidadeMil: 0 })).movimentacoes).toHaveLength(0);
  });
});

describe('edição', () => {
  it('permite manter o próprio nome e não muda quantidade nem unidade; atualizadoEm muda', () => {
    const d0 = ok(criarProduto(dadosVazios(), arroz, '2026-01-01T00:00:00.000Z'));
    const id = d0.produtos[0].id;
    const d = ok(editarProduto(d0, id, { nome: ' Arroz 5 kg ', categoria: ' Grãos ', precoCentavos: 3000, estoqueMinimoMil: 1000 }, '2026-02-01T00:00:00.000Z'));
    expect(d.produtos[0]).toMatchObject({
      nome: 'Arroz 5 kg', categoria: 'Grãos', precoCentavos: 3000, estoqueMinimoMil: 1000,
      quantidadeMil: 2000, unidade: 'un',
      criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-02-01T00:00:00.000Z',
    });
    expect(d.movimentacoes).toEqual(d0.movimentacoes);
  });
  it('recusa nome de outro produto', () => {
    const { d: d0 } = base();
    const d1 = ok(criarProduto(d0, { ...arroz, nome: 'Feijão' }));
    const e = erro(editarProduto(d1, d1.produtos[1].id, { nome: 'arroz 5 kg', categoria: '', precoCentavos: 1, estoqueMinimoMil: 0 }));
    expect(e.nome).toBe('Já existe um produto com esse nome.');
  });
  it('valida preço e mínimo conforme a unidade', () => {
    const { d, id } = base();
    const e = erro(editarProduto(d, id, { nome: 'Arroz 5 kg', categoria: '', precoCentavos: -1, estoqueMinimoMil: 500 }));
    expect(e.preco).toBe('Informe um valor válido.');
    expect(e.estoqueMinimo).toBe('Para unidade "un", use números inteiros.');
  });
  it('produto inexistente', () => {
    const { d } = base();
    expect(editarProduto(d, 'nope', { nome: 'a', categoria: '', precoCentavos: 0, estoqueMinimoMil: 0 }).ok).toBe(false);
  });
});

describe('entrada e saída', () => {
  it('entrada soma e registra saldo', () => {
    const { d, id } = base();
    const r = ok(registrarEntrada(d, id, 3000, '  compra '));
    expect(r.produtos[0].quantidadeMil).toBe(5000);
    expect(r.movimentacoes.at(-1)).toMatchObject({ tipo: 'entrada', quantidadeMil: 3000, saldoAposMil: 5000, observacao: 'compra' });
  });
  it('observação vazia vira undefined', () => {
    const { d, id } = base();
    expect(ok(registrarEntrada(d, id, 1000, '  ')).movimentacoes.at(-1)!.observacao).toBeUndefined();
  });
  it('saída subtrai com motivo', () => {
    const { d, id } = base();
    const r = ok(registrarSaida(d, id, 1000, 'perda'));
    expect(r.produtos[0].quantidadeMil).toBe(1000);
    expect(r.movimentacoes.at(-1)).toMatchObject({ tipo: 'saida', motivo: 'perda', saldoAposMil: 1000 });
  });
  it('invariante: saldo = entradas - saídas após 6 movimentações', () => {
    const { d: d0, id } = base();
    let d = d0;
    d = ok(registrarEntrada(d, id, 3000));
    d = ok(registrarSaida(d, id, 1000, 'venda'));
    d = ok(registrarEntrada(d, id, 2000));
    d = ok(registrarSaida(d, id, 4000, 'ajuste'));
    d = ok(registrarEntrada(d, id, 1000));
    d = ok(registrarSaida(d, id, 500 * 2, 'perda'));
    expect(d.movimentacoes).toHaveLength(7);
    const soma = (t: string) => d.movimentacoes.filter((m) => m.tipo === t).reduce((s, m) => s + m.quantidadeMil, 0);
    expect(d.produtos[0].quantidadeMil).toBe(soma('entrada') - soma('saida'));
    expect(d.movimentacoes.at(-1)!.saldoAposMil).toBe(d.produtos[0].quantidadeMil);
  });
});

describe('bloqueio', () => {
  it('saída maior que o saldo é recusada', () => {
    const { d, id } = base();
    expect(registrarSaida(d, id, 3000, 'venda')).toEqual({ ok: false, erro: 'Saída maior que o saldo. Disponível: 2 un.' });
  });
  it('saída igual ao saldo zera', () => {
    const { d, id } = base();
    expect(ok(registrarSaida(d, id, 2000, 'venda')).produtos[0].quantidadeMil).toBe(0);
  });
  it('quantidade zero, negativa ou não inteira', () => {
    const { d, id } = base();
    expect(erro(registrarSaida(d, id, 0, 'venda'))).toBe('Informe uma quantidade maior que zero.');
    expect(erro(registrarEntrada(d, id, -1000))).toBe('Informe uma quantidade maior que zero.');
    expect(erro(registrarEntrada(d, id, 1.5))).toBe('Informe uma quantidade maior que zero.');
  });
  it('decimal em un', () => {
    const { d, id } = base();
    expect(erro(registrarEntrada(d, id, 1500))).toBe('Para unidade "un", use números inteiros.');
    expect(erro(registrarSaida(d, id, 500, 'venda'))).toBe('Para unidade "un", use números inteiros.');
  });
  it('entrada acima do limite', () => {
    const { d, id } = base();
    expect(erro(registrarEntrada(d, id, 1_000_000_000))).toBe('Valor muito alto.');
  });
  it('produto inexistente', () => {
    const { d } = base();
    expect(erro(registrarEntrada(d, 'nope', 1000))).toBe('Produto não encontrado.');
    expect(erro(registrarSaida(d, 'nope', 1000, 'venda'))).toBe('Produto não encontrado.');
  });
});

describe('imutabilidade', () => {
  it('nenhuma operação altera o objeto recebido, inclusive as recusadas', () => {
    const { d, id } = base();
    const copia = structuredClone(d);
    const alt = { nome: 'Novo', categoria: 'c', precoCentavos: 1, estoqueMinimoMil: 0 };
    criarProduto(d, { ...arroz, nome: 'Feijão' });
    criarProduto(d, { ...arroz, nome: '' });
    editarProduto(d, id, alt);
    editarProduto(d, id, { ...alt, nome: '' });
    registrarEntrada(d, id, 1000);
    registrarEntrada(d, id, 0);
    registrarSaida(d, id, 1000, 'venda');
    registrarSaida(d, id, 9000, 'venda');
    excluirProduto(d, id);
    resumo(d); categorias(d); filtrarProdutos(d.produtos, '', false); filtrarMovimentacoes(d, {});
    expect(d).toEqual(copia);
  });
});

describe('alerta', () => {
  it.each([
    [4000, 5000, true], [5000, 5000, true], [6000, 5000, false], [0, 0, true], [1000, 0, false],
  ])('%i com mínimo %i -> %s', (q, min, esperado) => {
    expect(emAlerta(prod(q, min))).toBe(esperado);
  });
});

describe('exclusão', () => {
  it('remove o produto e só as movimentações dele', () => {
    const { d: d0, id } = base();
    let d = ok(criarProduto(d0, { ...arroz, nome: 'Feijão' }));
    const outro = d.produtos[1].id;
    d = ok(registrarEntrada(d, id, 1000));
    expect(contarMovimentacoes(d, id)).toBe(2);
    expect(contarMovimentacoes(d, outro)).toBe(1);
    const r = excluirProduto(d, id);
    expect(r.produtos.map((p) => p.id)).toEqual([outro]);
    expect(r.movimentacoes).toHaveLength(1);
    expect(r.movimentacoes[0].produtoId).toBe(outro);
  });
});

describe('consultas', () => {
  function varios(): Dados {
    let d = ok(criarProduto(dadosVazios(), { ...arroz, quantidadeMil: 2000 }));
    d = ok(criarProduto(d, { nome: 'Feijão carioca', categoria: 'Mercearia', precoCentavos: 4200, unidade: 'kg', quantidadeMil: 800, estoqueMinimoMil: 500 }));
    d = ok(criarProduto(d, { nome: 'Água', categoria: 'Bebidas', precoCentavos: 0, unidade: 'L', quantidadeMil: 0, estoqueMinimoMil: 0 }));
    return d;
  }
  it('resumo', () => {
    const d = ok(criarProduto(ok(criarProduto(dadosVazios(), arroz)), { nome: 'Feijão', categoria: '', precoCentavos: 4200, unidade: 'kg', quantidadeMil: 800, estoqueMinimoMil: 100 }));
    expect(valorEmEstoqueCentavos(d.produtos[1])).toBe(3360);
    expect(resumo(d)).toEqual({ totalProdutos: 2, emAlerta: 1, valorCentavos: 9140 });
  });
  it('categorias distintas, não vazias e ordenadas', () => {
    const d = varios();
    d.produtos.push({ ...d.produtos[0], id: 'z', nome: 'z', categoria: '' }, { ...d.produtos[0], id: 'y', nome: 'y' });
    expect(categorias(d)).toEqual(['Bebidas', 'Mercearia']);
  });
  it('filtrarProdutos sem acento e caixa, por categoria, soBaixo e ordem', () => {
    const ps = varios().produtos;
    expect(filtrarProdutos(ps, 'feijao', false).map((p) => p.nome)).toEqual(['Feijão carioca']);
    expect(filtrarProdutos(ps, 'MERCEARIA', false)).toHaveLength(2);
    expect(filtrarProdutos(ps, '', true).map((p) => p.nome)).toEqual(['Água', 'Arroz 5 kg']);
    expect(filtrarProdutos(ps, '', false).map((p) => p.nome)).toEqual(['Água', 'Arroz 5 kg', 'Feijão carioca']);
  });
  it('filtrarMovimentacoes: mais recente primeiro, desempate pela última registrada, filtros', () => {
    let d = ok(criarProduto(dadosVazios(), { ...arroz, quantidadeMil: 0 }, '2026-01-01T00:00:00.000Z'));
    const id = d.produtos[0].id;
    d = ok(criarProduto(d, { ...arroz, nome: 'B', quantidadeMil: 1000 }, '2026-01-01T00:00:00.000Z'));
    const b = d.produtos[1].id;
    d = ok(registrarEntrada(d, id, 1000, 'a', '2026-01-02T00:00:00.000Z'));
    d = ok(registrarSaida(d, id, 1000, 'venda', 'b', '2026-01-03T00:00:00.000Z'));
    d = ok(registrarEntrada(d, id, 1000, 'c', '2026-01-03T00:00:00.000Z'));
    expect(filtrarMovimentacoes(d, {}).map((m) => m.observacao)).toEqual(['c', 'b', 'a', 'Estoque inicial']);
    expect(filtrarMovimentacoes(d, { produtoId: b })).toHaveLength(1);
    expect(filtrarMovimentacoes(d, { tipo: 'saida' }).map((m) => m.observacao)).toEqual(['b']);
    expect(filtrarMovimentacoes(d, { produtoId: id, tipo: 'entrada' }).map((m) => m.observacao)).toEqual(['c', 'a']);
  });
});
