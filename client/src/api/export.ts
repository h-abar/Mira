import client from './client';

/**
 * Generic export downloader — calls a backend export endpoint
 * and triggers a file download (Excel or PDF blob).
 */
export async function downloadExport(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
): Promise<void> {
  const format = params.format === 'pdf' ? 'pdf' : 'excel';
  const response = await client.get<Blob>(endpoint, {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `export.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
