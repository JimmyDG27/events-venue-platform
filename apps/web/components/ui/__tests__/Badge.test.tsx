import { render, screen } from '@testing-library/react';
import { Badge, BadgeVariant } from '../Badge';

const variants: BadgeVariant[] = ['active', 'completed', 'rejected', 'cancelled', 'scheduled'];

describe('Badge', () => {
  it.each(variants)('renders default label for variant "%s"', (variant) => {
    render(<Badge variant={variant} />);
    const expected = variant.charAt(0).toUpperCase() + variant.slice(1);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('renders custom children over default label', () => {
    render(<Badge variant="active">In Progress</Badge>);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('applies active variant styles', () => {
    render(<Badge variant="active" />);
    expect(screen.getByText('Active').className).toContain('text-emerald-700');
  });

  it('applies rejected variant styles', () => {
    render(<Badge variant="rejected" />);
    expect(screen.getByText('Rejected').className).toContain('text-red-600');
  });

  it('applies cancelled variant styles', () => {
    render(<Badge variant="cancelled" />);
    expect(screen.getByText('Cancelled').className).toContain('text-amber-700');
  });

  it('merges custom className', () => {
    render(<Badge variant="scheduled" className="test-class" />);
    expect(screen.getByText('Scheduled').className).toContain('test-class');
  });
});
