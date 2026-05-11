import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';
import Sidebar from '@/components/layout/Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Sidebar', () => {
  test('shows KPI Report links for JPP, NodeB, HEM, and Engineering', async () => {
    const user = userEvent.setup();

    render(<Sidebar open={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /kpi report/i }));

    expect(screen.getByRole('link', { name: /jpp/i })).toHaveAttribute(
      'href',
      '/kpi-report/jpp'
    );
    expect(screen.getByRole('link', { name: /nodeb/i })).toHaveAttribute(
      'href',
      '/kpi-report/nodeb'
    );
    expect(screen.getByRole('link', { name: /hem/i })).toHaveAttribute(
      'href',
      '/kpi-report/hem'
    );
    expect(screen.getByRole('link', { name: /engineering/i })).toHaveAttribute(
      'href',
      '/kpi-report/engineering'
    );
  });
});
