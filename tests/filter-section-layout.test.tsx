import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FilterSection } from '../src/components/features/dashboard/FilterSection';

const noop = () => undefined;

describe('FilterSection layout', () => {
  it('uses four desktop columns when four project filters are visible', () => {
    render(
      <FilterSection
        searchQuery=""
        setSearchQuery={noop}
        statusFilter=""
        setStatusFilter={noop}
        subStatusFilter=""
        setSubStatusFilter={noop}
        areaFilter=""
        setAreaFilter={noop}
        branchFilter=""
        setBranchFilter={noop}
        showAreaBranchFilters
        resetFilters={noop}
        filterOptions={{
          statuses: ['Progress'],
          subStatuses: ['Survey'],
          areas: ['Area A'],
          branches: ['Branch A'],
        }}
      />
    );

    const filterGrid = screen.getByLabelText('Filter branch').parentElement?.parentElement;

    expect(filterGrid).toHaveClass('lg:grid-cols-4');
    expect(filterGrid).not.toHaveClass('lg:grid-cols-6');
  });

  it('uses five desktop columns when NodeB project filters are visible', () => {
    render(
      <FilterSection
        searchQuery=""
        setSearchQuery={noop}
        statusFilter=""
        setStatusFilter={noop}
        subStatusFilter=""
        setSubStatusFilter={noop}
        areaFilter=""
        setAreaFilter={noop}
        branchFilter=""
        setBranchFilter={noop}
        showAreaBranchFilters={false}
        tematikFilter=""
        setTematikFilter={noop}
        monthFilter=""
        setMonthFilter={noop}
        yearFilter=""
        setYearFilter={noop}
        resetFilters={noop}
        filterOptions={{
          statuses: ['Progress'],
          subStatuses: ['Survey'],
          areas: [],
          branches: [],
          tematik: ['Tematik A'],
          months: [{ value: '2026-06', label: 'Juni 2026' }],
          years: ['2026'],
        }}
      />
    );

    const filterGrid = screen.getByLabelText('Filter tahun').parentElement?.parentElement;

    expect(filterGrid).toHaveClass('lg:grid-cols-5');
    expect(filterGrid).not.toHaveClass('lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]');
  });
});
