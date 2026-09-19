// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import SearchFormPage from './SearchFormPage';

afterEach(cleanup);

function renderForm() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SearchFormPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it('keeps text, autocomplete, and number fields focused while typing', () => {
  renderForm();
  const title = screen.getByLabelText('نام جستجو') as HTMLInputElement;
  const brand = screen.getByText('برند').closest('label')?.querySelector('input') as HTMLInputElement;
  const price = screen.getByLabelText('حداقل قیمت (تومان)') as HTMLInputElement;

  for (const [input, first, second] of [
    [title, 'پ', 'پراید'],
    [brand, 'پ', 'پژو'],
    [price, '1', '12'],
  ] as const) {
    input.focus();
    fireEvent.change(input, { target: { value: first } });
    expect(input.isConnected).toBe(true);
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: second } });
    expect(input.value).toBe(second);
    expect(document.activeElement).toBe(input);
  }
});

it('selects multiple models and trims and removes trims when their model is removed', () => {
  renderForm();
  const brand = screen.getByText('برند').closest('label')?.querySelector('input') as HTMLInputElement;
  fireEvent.change(brand, { target: { value: 'پژو' } });

  const models = screen.getByRole('textbox', { name: 'مدل‌ها' });
  fireEvent.change(models, { target: { value: '206' } });
  fireEvent.keyDown(models, { key: 'Enter', code: 'Enter' });
  fireEvent.change(models, { target: { value: '207i' } });
  fireEvent.click(screen.getByRole('button', { name: /^207i$/ }));
  expect(screen.getByRole('button', { name: 'حذف 206' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'حذف 207i' })).toBeDefined();

  const trims = screen.getByRole('textbox', { name: 'تیپ‌ها' });
  fireEvent.change(trims, { target: { value: 'SD V8' } });
  fireEvent.click(screen.getByRole('button', { name: /^SD V8$/ }));
  fireEvent.change(trims, { target: { value: 'اتوماتیک MC' } });
  fireEvent.click(screen.getByRole('button', { name: /^اتوماتیک MC$/ }));
  expect(screen.getByRole('button', { name: 'حذف SD V8' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'حذف اتوماتیک MC' })).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'حذف 206' }));
  expect(screen.queryByRole('button', { name: 'حذف SD V8' })).toBeNull();
  expect(screen.getByRole('button', { name: 'حذف اتوماتیک MC' })).toBeDefined();
});
