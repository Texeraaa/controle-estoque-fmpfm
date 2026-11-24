import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import { CHAVE } from './armazenamento/local';

vi.mock('./armazenamento/baixar');

const MSG_DIALOGO = 'Não foi possível salvar. Feche e exporte um backup na aba Backup.';
const MSG_FAIXA = 'Não foi possível salvar. Exporte um backup na aba Backup.';

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const guardado = () => localStorage.getItem(CHAVE);

function falharGravacao() {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('cheio');
  });
}

async function cadastrarArroz() {
  await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
  await userEvent.type(screen.getByLabelText('Nome'), 'Arroz 5 kg');
  await userEvent.type(screen.getByLabelText('Quantidade inicial'), '2');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
}

test('novo produto: falha ao gravar mostra o aviso dentro do diálogo e mantém o que foi digitado', async () => {
  render(<App />);
  falharGravacao();
  await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
  await userEvent.type(screen.getByLabelText('Nome'), 'Arroz 5 kg');
  await userEvent.type(screen.getByLabelText('Preço (R$)'), '28,90');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  const dialogo = screen.getByRole('dialog');
  expect(within(dialogo).getByRole('alert')).toHaveTextContent(MSG_DIALOGO);
  expect(within(dialogo).getByLabelText('Nome')).toHaveValue('Arroz 5 kg');
  expect(within(dialogo).getByLabelText('Preço (R$)')).toHaveValue('28,90');
  expect(guardado()).toBeNull();
});

test('editar produto: falha ao gravar mostra o aviso dentro do diálogo', async () => {
  render(<App />);
  await cadastrarArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Arroz 5 kg' }));
  const antes = guardado();
  falharGravacao();
  await userEvent.clear(screen.getByLabelText('Preço (R$)'));
  await userEvent.type(screen.getByLabelText('Preço (R$)'), '9');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  const dialogo = screen.getByRole('dialog');
  expect(within(dialogo).getByRole('alert')).toHaveTextContent(MSG_DIALOGO);
  expect(within(dialogo).getByLabelText('Preço (R$)')).toHaveValue('9');
  expect(guardado()).toBe(antes);
});

test('excluir produto: falha ao gravar mostra o aviso dentro do diálogo e não apaga', async () => {
  render(<App />);
  await cadastrarArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Arroz 5 kg' }));
  const antes = guardado();
  falharGravacao();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await userEvent.click(screen.getByRole('button', { name: 'Excluir produto' }));
  const dialogo = screen.getByRole('dialog');
  expect(within(dialogo).getByRole('alert')).toHaveTextContent(MSG_DIALOGO);
  expect(guardado()).toBe(antes);
});

test('movimentação: falha ao gravar mostra o aviso dentro da folha e mantém a quantidade', async () => {
  render(<App />);
  await cadastrarArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Registrar entrada de Arroz 5 kg' }));
  const antes = guardado();
  falharGravacao();
  await userEvent.type(screen.getByLabelText('Quantidade'), '4');
  await userEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
  const dialogo = screen.getByRole('dialog');
  expect(within(dialogo).getByRole('alert')).toHaveTextContent(MSG_DIALOGO);
  expect(within(dialogo).getByLabelText('Quantidade')).toHaveValue('4');
  expect(guardado()).toBe(antes);
});

test('sem diálogo aberto, falha ao registrar o backup mostra a faixa de erro', async () => {
  render(<App />);
  await cadastrarArroz();
  await userEvent.click(screen.getByRole('button', { name: 'Backup' }));
  expect(screen.queryByText(MSG_FAIXA)).not.toBeInTheDocument();
  falharGravacao();
  await userEvent.click(screen.getByRole('button', { name: 'Exportar backup' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(MSG_FAIXA);
});
