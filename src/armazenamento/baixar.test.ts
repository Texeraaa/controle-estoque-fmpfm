import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { baixarArquivo } from './baixar';

beforeEach(() => {
  vi.useFakeTimers();
  URL.createObjectURL = vi.fn(() => 'blob:teste');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('clica no link, remove-o e só revoga a URL do blob depois de um tempo', () => {
  baixarArquivo('a.json', '{}', 'application/json');
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  expect(document.querySelector('a[download]')).toBeNull();
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(9_999);
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(60_000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:teste');
});
