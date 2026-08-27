import JsBarcode from 'jsbarcode';

export function barcodeSvgDataUrl(value: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, {
    format: 'CODE128',
    width: 2,
    height: 55,
    margin: 6,
    displayValue: true,
    font: 'monospace',
    fontSize: 13,
    textMargin: 2,
    background: '#ffffff',
    lineColor: '#000000',
  });
  const xml = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}