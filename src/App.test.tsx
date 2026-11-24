import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import { CHAVE } from './armazenamento/local';

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test('mostra o título do app', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Estoque' })).toBeInTheDocument();
});

test('abas: Produtos ativa de início e troca ao tocar', async () => {
  render(<App />);
  const nav = screen.getByRole('navigation');
  expect(screen.getByRole('button', { name: 'Produtos' })).toHaveAttribute('aria-current', 'page');
  expect(nav).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Histórico' }));
  expect(screen.getByRole('button', { name: 'Histórico' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: 'Produtos' })).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Backup' }));
  expect(screen.getByRole('heading', { name: 'Backup' })).toBeInTheDocument();
});

test('dados ilegíveis mostram a tela de recuperação e Começar do zero pede confirmação', async () => {
  localStorage.setItem(CHAVE, '{quebrado');
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<App />);
  expect(screen.getByText('Os dados salvos estão ilegíveis.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Baixar dados brutos' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Começar do zero' }));
  expect(confirmar).toHaveBeenCalled();
  expect(screen.getByText('Os dados salvos estão ilegíveis.')).toBeInTheDocument();
  confirmar.mockReturnValue(true);
  await userEvent.click(screen.getByRole('button', { name: 'Começar do zero' }));
  expect(screen.queryByText('Os dados salvos estão ilegíveis.')).not.toBeInTheDocument();
  expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument();
});

test('armazenamento que não pode ser lido também mostra a tela de dados ilegíveis', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqueado');
  });
  render(<App />);
  expect(screen.getByText('Os dados salvos estão ilegíveis.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Novo produto' })).not.toBeInTheDocument();
});

test('menu lateral: recolhe, expande e lembra a escolha', async () => {
  const { unmount } = render(<App />);
  expect(screen.getByText('Estoka', { selector: '.menu .marca-nome' })).toBeInTheDocument();
  const recolher = screen.getByRole('button', { name: 'Recolher menu' });
  expect(recolher).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(recolher);
  const expandir = screen.getByRole('button', { name: 'Expandir menu' });
  expect(expandir).toHaveAttribute('aria-expanded', 'false');
  expect(document.querySelector('.app')).toHaveClass('app-menu-recolhido');
  // Recolhido, as seções continuam com nome acessível.
  expect(screen.getByRole('button', { name: 'Histórico' })).toBeInTheDocument();
  unmount();
  render(<App />);
  expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Expandir menu' }));
  expect(document.querySelector('.app')).not.toHaveClass('app-menu-recolhido');
});
