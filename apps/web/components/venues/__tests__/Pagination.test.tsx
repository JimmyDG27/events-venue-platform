import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Pagination } from '../Pagination';

const mockPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) return `${key} ${JSON.stringify(values)}`;
    return key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/venues',
}));

describe('Pagination', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} searchParams={{}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders prev and next buttons', () => {
    render(<Pagination currentPage={2} totalPages={5} searchParams={{}} />);
    expect(screen.getByText(/prevPage/)).toBeInTheDocument();
    expect(screen.getByText(/nextPage/)).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={3} searchParams={{}} />);
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons.find((b) => b.textContent?.includes('prevPage'));
    expect(prevBtn).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={3} totalPages={3} searchParams={{}} />);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons.find((b) => b.textContent?.includes('nextPage'));
    expect(nextBtn).toBeDisabled();
  });

  it('navigates to next page on click', () => {
    render(<Pagination currentPage={2} totalPages={5} searchParams={{ location: 'London' }} />);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons.find((b) => b.textContent?.includes('nextPage'))!;
    fireEvent.click(nextBtn);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=3'));
  });

  it('navigates to prev page on click', () => {
    render(<Pagination currentPage={2} totalPages={5} searchParams={{}} />);
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons.find((b) => b.textContent?.includes('prevPage'))!;
    fireEvent.click(prevBtn);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });
});
