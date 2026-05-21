import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ColumnConfigClient from '../src/components/features/settings/ColumnConfigClient';
import { COLUMN_FIELDS } from '../src/lib/sheet-columns';

describe('ColumnConfigClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the detected column count from the API result', async () => {
    const initialConfig = COLUMN_FIELDS.map((field, sort_order) => ({
      field_key: field.key,
      label: field.label,
      header_text: field.headerText,
      col_index: field.defaultIndex,
      sort_order,
    }));
    const detected = initialConfig.map((field) => ({
      field_key: field.field_key,
      detected_index: field.col_index,
      matched_header: field.header_text,
    }));

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { detected },
      }),
    } as Response);

    render(<ColumnConfigClient initialConfig={initialConfig} />);

    fireEvent.click(screen.getByRole('button', { name: /detect|deteksi dari header/i }));

    await waitFor(() => {
      expect(screen.getByText('Deteksi selesai: 36 kolom cocok.')).toBeInTheDocument();
    });
  });
});
