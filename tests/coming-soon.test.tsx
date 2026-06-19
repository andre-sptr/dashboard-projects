import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComingSoon from '../src/components/ui/ComingSoon';

describe('ComingSoon', () => {
  it('renders the title and the default message', () => {
    render(<ComingSoon title="BoQ Plan — NodeB" />);
    expect(screen.getByText('BoQ Plan — NodeB')).toBeInTheDocument();
    expect(screen.getByText('Halaman ini belum tersedia.')).toBeInTheDocument();
  });

  it('renders a custom description when provided', () => {
    render(<ComingSoon title="Report — HEM" description="Segera hadir" />);
    expect(screen.getByText('Segera hadir')).toBeInTheDocument();
  });
});
