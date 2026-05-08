import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '@/components/layout/Sidebar';

const mockPathname = '/boq';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

describe('Sidebar', () => {
  it('keeps Dashboard top-level and opens the active route category', () => {
    render(<Sidebar open onClose={vi.fn()} />);
    const nav = within(screen.getByRole('navigation'));

    expect(nav.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /project tracking/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('link', { name: /boq plan/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /advanced analytics/i })).not.toBeInTheDocument();
  });

  it('toggles category links', async () => {
    const user = userEvent.setup();
    render(<Sidebar open onClose={vi.fn()} />);

    const monitoringButton = screen.getByRole('button', { name: /monitoring/i });

    expect(monitoringButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /report/i })).not.toBeInTheDocument();

    await user.click(monitoringButton);

    expect(monitoringButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /report/i })).toBeInTheDocument();

    await user.click(monitoringButton);

    expect(monitoringButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /report/i })).not.toBeInTheDocument();
  });
});
