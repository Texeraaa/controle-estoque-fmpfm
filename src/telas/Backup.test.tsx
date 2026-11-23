import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { baixarArquivo } from '../armazenamento/baixar';
import { gerarBackup } from '../armazenamento/backup';
import { criarProduto, dadosVazios, registrarEntrada } from '../dominio/estoque';
import type { Dados } from '../dominio/tipos';
import { Backup } from './Backup';

vi.mock('../armazenamento/baixar');

function ok(r: { ok: boolean; valor?: Dados; erro?: unknown }): Dados {
  if (!r.ok) throw new Error(JSON.stringify(r.erro));
  return r.valor as Dados;
}

function comProdutos(): Dados {
  let d = ok(criarProduto(dadosVazios(), { nome: 'Arroz', categoria: '', precoCentavos: 100, unidade: 'un', quantidadeMil: 1000, estoqueMinimoMil: 0 }));
  d = ok(criarProduto(d, { nome: 'Feijão', categoria: '', precoCentavos: 100, unidade: 'un', quantidadeMil: 1000, estoqueMinimoMil: 0 }));
  return ok(registrarEntrada(d, d.produtos[0].id, 1000));
}

beforeEach(() => {
  vi.mocked(baixarArquivo).mockClear();
});

test('sem backup anterior avisa', () => {
  render(<Backup dados={dadosVazios()} aoAplicar={vi.fn()} />);
  expect(screen.getByText('Nenhum backup feito ainda')).toBeInTheDocument();
  expect(
    screen.getByText('Seus dados ficam salvos apenas neste aparelho e neste navegador. Exporte um backup com frequência.'),
  ).toBeInTheDocument();
});

test('mostra hoje, há 1 dia e há N dias', () => {
  const agora = new Date();
  const antes = (n: number) => new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - n, 12).toISOString();
  const { rerender } = render(<Backup dados={{ ...dadosVazios(), ultimoBackupEm: agora.toISOString() }} aoAplicar={vi.fn()} />);
  expect(screen.getByText('Último backup: hoje')).toBeInTheDocument();
  rerender(<Backup dados={{ ...dadosVazios(), ultimoBackupEm: antes(1) }} aoAplicar={vi.fn()} />);
  expect(screen.getByText('Último backup: há 1 dia')).toBeInTheDocument();
  rerender(<Backup dados={{ ...dadosVazios(), ultimoBackupEm: antes(5) }} aoAplicar={vi.fn()} />);
  expect(screen.getByText('Último backup: há 5 dias')).toBeInTheDocument();
});

test('exportar backup baixa o arquivo e grava ultimoBackupEm', async () => {
  const aoAplicar = vi.fn().mockReturnValue(true);
  render(<Backup dados={comProdutos()} aoAplicar={aoAplicar} />);
  await userEvent.click(screen.getByRole('button', { name: 'Exportar backup' }));
  expect(baixarArquivo).toHaveBeenCalledWith(expect.stringMatching(/^estoque-backup-.*\.json$/), expect.any(String), 'application/json');
  expect(aoAplicar).toHaveBeenCalledWith(expect.objectContaining({ ultimoBackupEm: expect.any(String) }));
});

test('exportar baixa o arquivo mesmo que a gravação falhe', async () => {
  const aoAplicar = vi.fn().mockReturnValue(false);
  render(<Backup dados={comProdutos()} aoAplicar={aoAplicar} />);
  await userEvent.click(screen.getByRole('button', { name: 'Exportar backup' }));
  expect(baixarArquivo).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('arquivo inválido mostra erro e não altera nada', async () => {
  const aoAplicar = vi.fn();
  render(<Backup dados={dadosVazios()} aoAplicar={aoAplicar} />);
  await userEvent.upload(screen.getByLabelText('Importar backup'), new File(['lixo'], 'x.json', { type: 'application/json' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Arquivo de backup inválido.');
  expect(aoAplicar).not.toHaveBeenCalled();
});

test('backup válido pede confirmação; cancelar não aplica; substituir aplica', async () => {
  const doArquivo = gerarBackup(comProdutos()).dados;
  const arquivo = () => new File([JSON.stringify(doArquivo)], 'b.json', { type: 'application/json' });
  const aoAplicar = vi.fn().mockReturnValue(true);
  render(<Backup dados={dadosVazios()} aoAplicar={aoAplicar} />);
  const campo = screen.getByLabelText('Importar backup');

  await userEvent.upload(campo, arquivo());
  expect(
    await screen.findByText('Este backup tem 2 produtos e 3 movimentações. Importar substitui todos os dados atuais.'),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(aoAplicar).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Substituir dados' })).not.toBeInTheDocument();

  await userEvent.upload(campo, arquivo());
  await userEvent.click(await screen.findByRole('button', { name: 'Substituir dados' }));
  expect(aoAplicar).toHaveBeenCalledWith(doArquivo);
  expect(screen.getByText('Backup importado.')).toBeInTheDocument();
});

test('singular na confirmação', async () => {
  const d = ok(criarProduto(dadosVazios(), { nome: 'Sal', categoria: '', precoCentavos: 100, unidade: 'un', quantidadeMil: 1000, estoqueMinimoMil: 0 }));
  render(<Backup dados={dadosVazios()} aoAplicar={vi.fn()} />);
  await userEvent.upload(screen.getByLabelText('Importar backup'), new File([JSON.stringify(d)], 'b.json'));
  expect(await screen.findByText(/Este backup tem 1 produto e 1 movimentação\./)).toBeInTheDocument();
});

test('falha ao salvar a importação mostra alerta', async () => {
  const d = comProdutos();
  render(<Backup dados={dadosVazios()} aoAplicar={vi.fn().mockReturnValue(false)} />);
  await userEvent.upload(screen.getByLabelText('Importar backup'), new File([JSON.stringify(d)], 'b.json'));
  await userEvent.click(await screen.findByRole('button', { name: 'Substituir dados' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.');
  expect(screen.queryByText('Backup importado.')).not.toBeInTheDocument();
});

test('exportar planilha baixa o CSV', async () => {
  render(<Backup dados={comProdutos()} aoAplicar={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Exportar planilha (CSV)' }));
  expect(baixarArquivo).toHaveBeenCalledWith(expect.stringMatching(/^estoque-.*\.csv$/), expect.any(String), 'text/csv;charset=utf-8');
});
