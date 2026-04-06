import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthForm } from '../AuthForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockSubmit = vi.fn();

describe('AuthForm — register mode', () => {
  beforeEach(() => mockSubmit.mockClear());

  it('renders name, email and password fields', () => {
    render(<AuthForm mode="register" onSubmit={mockSubmit} />);
    expect(screen.getByRole('textbox', { name: /nameLabel/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /emailLabel/i })).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', () => {
    render(<AuthForm mode="register" onSubmit={mockSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /registerCta/i }));
    expect(screen.getByText('nameRequired')).toBeInTheDocument();
    expect(screen.getByText('emailRequired')).toBeInTheDocument();
    expect(screen.getByText('passwordRequired')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows password too short error', () => {
    render(<AuthForm mode="register" onSubmit={mockSubmit} />);
    const nameInput = screen.getByRole('textbox', { name: /nameLabel/i });
    const emailInput = screen.getByRole('textbox', { name: /emailLabel/i });
    const pwInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(pwInput, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /registerCta/i }));
    expect(screen.getByText('passwordTooShort')).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when form is valid', () => {
    render(<AuthForm mode="register" onSubmit={mockSubmit} />);
    const nameInput = screen.getByRole('textbox', { name: /nameLabel/i });
    const emailInput = screen.getByRole('textbox', { name: /emailLabel/i });
    const pwInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(pwInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /registerCta/i }));
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });
  });

  it('shows server error when error prop is set', () => {
    render(<AuthForm mode="register" onSubmit={mockSubmit} error="emailTaken" />);
    expect(screen.getByText('emailTaken')).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    render(<AuthForm mode="register" onSubmit={mockSubmit} />);
    const link = screen.getByRole('link', { name: /signIn/i });
    expect(link).toHaveAttribute('href', '/auth/login');
  });
});

describe('AuthForm — login mode', () => {
  beforeEach(() => mockSubmit.mockClear());

  it('does not render name field', () => {
    render(<AuthForm mode="login" onSubmit={mockSubmit} />);
    expect(screen.queryByRole('textbox', { name: /nameLabel/i })).toBeNull();
  });

  it('calls onSubmit without name', () => {
    render(<AuthForm mode="login" onSubmit={mockSubmit} />);
    const emailInput = screen.getByRole('textbox', { name: /emailLabel/i });
    const pwInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(pwInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /loginCta/i }));
    expect(mockSubmit).toHaveBeenCalledWith({
      name: undefined,
      email: 'alice@example.com',
      password: 'password123',
    });
  });

  it('shows link to register page', () => {
    render(<AuthForm mode="login" onSubmit={mockSubmit} />);
    const link = screen.getByRole('link', { name: /createAccount/i });
    expect(link).toHaveAttribute('href', '/auth/register');
  });
});
