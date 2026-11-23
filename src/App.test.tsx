import { render, screen } from '@testing-library/react';
import App from './App';

test('mostra o título do app', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Estoque' })).toBeInTheDocument();
});
