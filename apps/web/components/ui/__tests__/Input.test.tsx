import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders a label when label prop is provided', () => {
    render(<Input label="Email address" />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('associates label with input via id', () => {
    render(<Input label="Full Name" id="full-name" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'full-name');
    expect(screen.getByLabelText('Full Name')).toBe(input);
  });

  it('shows error message and marks input invalid', () => {
    render(<Input label="Email" error="Invalid email address" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text when no error', () => {
    render(<Input helperText="We will never share your email." />);
    expect(screen.getByText('We will never share your email.')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(<Input error="Required" helperText="Helper" />);
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input placeholder="Search…" />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });
});
