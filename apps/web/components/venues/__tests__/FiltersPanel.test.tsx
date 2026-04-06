import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FiltersPanel } from '../FiltersPanel';

const mockPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/venues',
}));

describe('FiltersPanel', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders all filter fields', () => {
    render(<FiltersPanel initialValues={{}} />);
    expect(screen.getByRole('button', { name: /clearFilters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filtersTitle/i })).toBeInTheDocument();
  });

  it('populates fields from initialValues', () => {
    render(
      <FiltersPanel
        initialValues={{ location: 'Shoreditch', capacity: '100' }}
      />,
    );
    const inputs = screen.getAllByRole('textbox');
    const locationInput = inputs.find((el) => (el as HTMLInputElement).name === 'location');
    expect(locationInput).toHaveValue('Shoreditch');
  });

  it('clears filters when clear button is clicked', () => {
    render(<FiltersPanel initialValues={{ location: 'Shoreditch' }} />);
    fireEvent.click(screen.getByRole('button', { name: /clearFilters/i }));
    expect(mockPush).toHaveBeenCalledWith('/venues');
  });

  it('submits with location filter', () => {
    render(<FiltersPanel initialValues={{}} />);
    const locationInput = screen.getAllByRole('textbox').find(
      (el) => (el as HTMLInputElement).name === 'location',
    )!;
    fireEvent.change(locationInput, { target: { value: 'Mayfair' } });
    fireEvent.submit(locationInput.closest('form')!);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('location=Mayfair'));
  });
});
