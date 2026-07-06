import QRCode from 'qrcode';
import type { IFinanceMonthlyRow } from '@cp/shared';

const TUITION_INVOICE_PAYMENT = {
  accountName: 'HKD_KCCT',
  accountNumber: '040130524070',
  bankName: 'Sacombank',
  bankCode: 'Sacombank',
  bankBin: '970403',
};
const TUITION_INVOICE_LEFT_CONTENT_CENTER_X = 448;
const TUITION_INVOICE_IMAGE_WIDTH = 1366;
const TUITION_INVOICE_IMAGE_HEIGHT = 768;
const TUITION_INVOICE_IMAGE_SCALE = 2;

type TuitionInvoiceRow = Pick<
  IFinanceMonthlyRow,
  'amountDue' | 'classNames' | 'grade' | 'profileId' | 'studentName'
>;

interface TuitionInvoiceHtmlOptions {
  row: TuitionInvoiceRow;
  month: string;
  from: string;
  to: string;
  issuedAt: string;
  money: Intl.NumberFormat;
  status: string;
}

interface TuitionInvoiceImageSvgOptions extends TuitionInvoiceHtmlOptions {
  qrImageUrl: string;
}

export function buildTuitionInvoiceQrUrl(row: TuitionInvoiceRow, month: string) {
  const memo = `HP ${row.studentName} ${month}`;
  const params = [
    ['acc', TUITION_INVOICE_PAYMENT.accountNumber],
    ['bank', TUITION_INVOICE_PAYMENT.bankCode],
    ['amount', String(Math.max(0, Math.round(row.amountDue)))],
    ['des', memo],
    ['template', 'compact'],
    ['holder', TUITION_INVOICE_PAYMENT.accountName],
    ['store', 'HOC PHI'],
  ];

  return `https://vietqr.app/img?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`;
}

export function buildTuitionInvoiceImageFilename(row: TuitionInvoiceRow, month: string) {
  return `hoa-don-hoc-phi-${slugify(row.studentName) || 'hoc-sinh'}-${month}.png`;
}

export function buildVietQrPayload(row: TuitionInvoiceRow, month: string) {
  const bankAccountInfo =
    emv('00', TUITION_INVOICE_PAYMENT.bankBin) + emv('01', TUITION_INVOICE_PAYMENT.accountNumber);
  const merchantAccountInfo =
    emv('00', 'A000000727') + emv('01', bankAccountInfo) + emv('02', 'QRIBFTTA');
  const transferMemo = normalizeTransferMemo(`HP ${row.studentName} ${month}`);
  const additionalData = emv('08', transferMemo);
  const amount = String(Math.max(0, Math.round(row.amountDue)));
  const payloadWithoutCrc = [
    emv('00', '01'),
    emv('01', '12'),
    emv('38', merchantAccountInfo),
    emv('53', '704'),
    emv('54', amount),
    emv('58', 'VN'),
    emv('62', additionalData),
    '6304',
  ].join('');

  return `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}`;
}

export async function buildTuitionInvoiceQrDataUrl(row: TuitionInvoiceRow, month: string) {
  return QRCode.toDataURL(buildVietQrPayload(row, month), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 260,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export function buildTuitionInvoiceImageSvg(options: TuitionInvoiceImageSvgOptions) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TUITION_INVOICE_IMAGE_WIDTH}" height="${TUITION_INVOICE_IMAGE_HEIGHT}" viewBox="0 0 ${TUITION_INVOICE_IMAGE_WIDTH} ${TUITION_INVOICE_IMAGE_HEIGHT}">
  <foreignObject width="${TUITION_INVOICE_IMAGE_WIDTH}" height="${TUITION_INVOICE_IMAGE_HEIGHT}">
    <div xmlns="http://www.w3.org/1999/xhtml" class="invoice-page">
      <style>${buildTuitionInvoiceStyles()}</style>
      ${buildTuitionInvoiceCard(options).replace(/&nbsp;/g, '&#160;')}
    </div>
  </foreignObject>
</svg>`;
}

export async function buildTuitionInvoicePngBlob(options: TuitionInvoiceHtmlOptions) {
  const qrImageUrl = await buildTuitionInvoiceQrDataUrl(options.row, options.month);
  const qrImage = await loadImage(qrImageUrl);
  return renderInvoiceCanvasToPngBlob(options, qrImage);
}

export function buildTuitionInvoiceHtml({
  row,
  month,
  from,
  to,
  issuedAt,
  money,
  status,
}: TuitionInvoiceHtmlOptions) {
  const invoiceNo = `FIN-${month}-${row.profileId.slice(0, 8).toUpperCase()}`;
  const qrUrl = buildTuitionInvoiceQrUrl(row, month);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeHtml(invoiceNo)} · ${escapeHtml(from)} - ${escapeHtml(to)} · ${escapeHtml(issuedAt)} · ${escapeHtml(status)}" />
  <title>Hóa đơn học phí ${escapeHtml(invoiceNo)}</title>
  <style>
    ${buildTuitionInvoiceStyles()}
  </style>
</head>
<body>
  <div class="invoice-page">
    ${buildTuitionInvoiceCard({ row, month, from, to, issuedAt, money, status, qrImageUrl: qrUrl })}
  </div>
</body>
</html>`;
}

function buildTuitionInvoiceStyles() {
  return `
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    .invoice-page {
      margin: 0;
      min-height: 100vh;
      width: 100%;
      padding: 16px;
      display: grid;
      place-items: center;
      background: #ffffff;
      color: #050505;
      font-family: Arial, Helvetica, sans-serif;
    }
    .invoice-card {
      width: min(100%, 1320px);
      min-height: 500px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 12px 390px;
      column-gap: 34px;
      padding: 34px 38px;
      border: 3px solid #e2e2e2;
      border-radius: 24px;
      background: #ffffff;
    }
    .invoice-main {
      display: grid;
      align-items: center;
      justify-content: center;
      min-width: 0;
    }
    .message {
      display: grid;
      align-content: center;
      justify-items: start;
      width: max-content;
      max-width: 100%;
      gap: 22px;
      font-size: 29px;
      line-height: 1.25;
      font-weight: 800;
      text-align: left;
    }
    .message p {
      margin: 0;
    }
    .message p:first-child strong,
    .message .tuition strong {
      color: #ff3047;
    }
    .message .thanks {
      margin-top: 2px;
      font-weight: 500;
    }
    .invoice-divider {
      width: 12px;
      min-height: 100%;
      border-radius: 2px;
      background: #0077b8;
    }
    .payment-panel {
      display: grid;
      align-content: center;
      gap: 18px;
      min-width: 0;
    }
    .qr-shell {
      padding: 38px 26px;
      border: 3px solid #dadce2;
      border-radius: 24px;
      background: #ffffff;
    }
    .qr-frame {
      display: grid;
      place-items: center;
      min-height: 228px;
      padding: 14px;
      border: 3px dashed #9aa0a6;
      border-radius: 18px;
      background: #ffffff;
    }
    .qr-frame img {
      display: block;
      width: 260px;
      max-width: 100%;
      height: auto;
    }
    .bank-details {
      display: grid;
      gap: 10px;
      font-size: 24px;
      line-height: 1.18;
      font-weight: 500;
      text-align: center;
    }
    .bank-details p {
      margin: 0;
    }
    @media print {
      .invoice-page {
        min-height: auto;
        padding: 0;
      }
      .invoice-card {
        width: 100%;
        min-height: 0;
        box-shadow: none;
      }
    }
  `;
}

function buildTuitionInvoiceCard({
  row,
  month,
  money,
  qrImageUrl,
}: TuitionInvoiceImageSvgOptions) {
  const className = row.classNames.join(', ') || `Khối ${row.grade}`;
  const monthLabel = formatInvoiceMonth(month);

  return `<main class="invoice-card">
    <section class="invoice-main">
      <section class="message">
        <p>Kính gửi phụ huynh em: <strong>${escapeHtml(row.studentName)}</strong></p>
        <p>Lớp: <strong>${escapeHtml(className)}</strong></p>
        <p class="tuition">HP tháng <strong>${escapeHtml(monthLabel)}</strong>: <strong>${formatInvoiceMoney(row.amountDue, money)}</strong></p>
        <p>PH chuyển khoản theo số tài khoản bên cạnh!</p>
        <p class="thanks">Xin cảm ơn!</p>
      </section>
    </section>

    <div class="invoice-divider" aria-hidden="true"></div>

    <aside class="payment-panel">
      <div class="qr-shell">
        <div class="qr-frame">
          <img src="${escapeHtml(qrImageUrl)}" alt="Ma QR chuyen khoan hoc phi" />
        </div>
      </div>
      <section class="bank-details">
        <p>Chủ TK: <strong>${escapeHtml(TUITION_INVOICE_PAYMENT.accountName)}</strong></p>
        <p>Số TK: <strong>${escapeHtml(TUITION_INVOICE_PAYMENT.accountNumber)}</strong></p>
        <p>Ngân hàng: <strong>${escapeHtml(TUITION_INVOICE_PAYMENT.bankName)}</strong></p>
      </section>
    </aside>
  </main>
`;
}

function formatInvoiceMonth(month: string) {
  const [year, monthNumber] = month.split('-');
  if (!year || !monthNumber) return month;
  return `${monthNumber.padStart(2, '0')}/${year}`;
}

function formatInvoiceMoney(value: number, money: Intl.NumberFormat) {
  return escapeHtml(money.format(value)).replace(/\s/g, '&nbsp;');
}

function emv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function normalizeTransferMemo(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

function slugify(value: string) {
  return normalizeTransferMemo(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function crc16CcittFalse(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

async function renderInvoiceCanvasToPngBlob(options: TuitionInvoiceHtmlOptions, qrImage: HTMLImageElement) {
  if (typeof document === 'undefined') {
    throw new Error('Invoice image generation requires a browser.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = TUITION_INVOICE_IMAGE_WIDTH * TUITION_INVOICE_IMAGE_SCALE;
  canvas.height = TUITION_INVOICE_IMAGE_HEIGHT * TUITION_INVOICE_IMAGE_SCALE;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create invoice image canvas.');

  context.scale(TUITION_INVOICE_IMAGE_SCALE, TUITION_INVOICE_IMAGE_SCALE);
  drawInvoiceCanvas(context, options, qrImage);

  return canvasToPngBlob(canvas);
}

function drawInvoiceCanvas(
  context: CanvasRenderingContext2D,
  { row, month, money }: TuitionInvoiceHtmlOptions,
  qrImage: HTMLImageElement,
) {
  const className = row.classNames.join(', ') || `Khối ${row.grade}`;
  const monthLabel = formatInvoiceMonth(month);
  const amount = money.format(row.amountDue);

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, TUITION_INVOICE_IMAGE_WIDTH, TUITION_INVOICE_IMAGE_HEIGHT);

  drawRoundedRect(context, 24, 100, 1318, 568, 24, '#ffffff', '#e2e2e2', 3);
  drawRoundedRect(context, 866, 135, 12, 498, 2, '#0077b8');

  drawLeftAlignedRichTextBlock(context, TUITION_INVOICE_LEFT_CONTENT_CENTER_X, [
    {
      y: 270,
      parts: [
        { text: 'Kính gửi phụ huynh em: ', color: '#050505', font: '800 29px Arial, Helvetica, sans-serif' },
        { text: row.studentName, color: '#ff3047', font: '800 29px Arial, Helvetica, sans-serif' },
      ],
    },
    {
      y: 328,
      parts: [
        { text: 'Lớp: ', color: '#050505', font: '800 29px Arial, Helvetica, sans-serif' },
        { text: className, color: '#050505', font: '800 29px Arial, Helvetica, sans-serif' },
      ],
    },
    {
      y: 386,
      parts: [
        { text: 'HP tháng ', color: '#050505', font: '800 29px Arial, Helvetica, sans-serif' },
        { text: monthLabel, color: '#ff3047', font: '800 29px Arial, Helvetica, sans-serif' },
        { text: ': ', color: '#ff3047', font: '800 29px Arial, Helvetica, sans-serif' },
        { text: amount, color: '#ff3047', font: '800 29px Arial, Helvetica, sans-serif' },
      ],
    },
    {
      y: 444,
      parts: [
        {
          text: 'PH chuyển khoản theo số tài khoản bên cạnh!',
          color: '#050505',
          font: '800 29px Arial, Helvetica, sans-serif',
        },
      ],
    },
    {
      y: 502,
      parts: [{ text: 'Xin cảm ơn!', color: '#050505', font: '400 29px Arial, Helvetica, sans-serif' }],
    },
  ]);

  drawQrPanel(context, qrImage);
  drawBankDetails(context);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not render invoice image.'));
    image.src = src;
  });
}

function drawQrPanel(context: CanvasRenderingContext2D, qrImage: HTMLImageElement) {
  drawRoundedRect(context, 912, 136, 390, 374, 22, '#ffffff', '#dadce2', 3);
  drawDashedRoundedRect(context, 942, 177, 330, 294, 18, '#9aa0a6', 3, [8, 6]);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 20px Arial, Helvetica, sans-serif';
  context.fillStyle = '#ee1939';
  context.fillStyle = '#336fa8';
  context.font = '900 15px Arial, Helvetica, sans-serif';

  context.drawImage(qrImage, 1018, 234, 184, 184);

  context.font = '900 12px Arial, Helvetica, sans-serif';
  context.fillStyle = '#336fa8';
  context.fillStyle = '#9b6b4d';
  context.fillText('SACOMBANK', 1108, 434);
}

function drawBankDetails(context: CanvasRenderingContext2D) {
  const rows = [
    ['Chủ TK: ', TUITION_INVOICE_PAYMENT.accountName],
    ['Số TK: ', TUITION_INVOICE_PAYMENT.accountNumber],
    ['Ngân hàng: ', TUITION_INVOICE_PAYMENT.bankName],
  ];

  context.textBaseline = 'middle';
  for (const [index, parts] of rows.entries()) {
    drawCenteredRichTextLine(context, 1107, 548 + index * 40, [
      { text: parts[0], color: '#050505', font: '400 24px Arial, Helvetica, sans-serif' },
      { text: parts[1], color: '#050505', font: '800 24px Arial, Helvetica, sans-serif' },
    ]);
  }
}

function drawRichTextLine(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  parts: Array<{ text: string; color: string; font: string }>,
) {
  let cursorX = x;
  context.textAlign = 'left';
  context.textBaseline = 'middle';

  for (const part of parts) {
    context.font = part.font;
    context.fillStyle = part.color;
    context.fillText(part.text, cursorX, y);
    cursorX += context.measureText(part.text).width;
  }
}

function drawCenteredRichTextLine(
  context: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  parts: Array<{ text: string; color: string; font: string }>,
) {
  const lineWidth = measureRichTextLine(context, parts);

  drawRichTextLine(context, centerX - lineWidth / 2, y, parts);
}

function drawLeftAlignedRichTextBlock(
  context: CanvasRenderingContext2D,
  centerX: number,
  lines: Array<{ y: number; parts: Array<{ text: string; color: string; font: string }> }>,
) {
  const maxLineWidth = Math.max(...lines.map((line) => measureRichTextLine(context, line.parts)));
  const startX = centerX - maxLineWidth / 2;

  for (const line of lines) {
    drawRichTextLine(context, startX, line.y, line.parts);
  }
}

function measureRichTextLine(
  context: CanvasRenderingContext2D,
  parts: Array<{ text: string; color: string; font: string }>,
) {
  return parts.reduce((width, part) => {
    context.font = part.font;
    return width + context.measureText(part.text).width;
  }, 0);
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle?: string,
  lineWidth = 1,
) {
  context.save();
  roundedRectPath(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
  if (strokeStyle) {
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;
    context.stroke();
  }
  context.restore();
}

function drawDashedRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number,
  dash: number[],
) {
  context.save();
  roundedRectPath(context, x, y, width, height, radius);
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  context.setLineDash(dash);
  context.stroke();
  context.restore();
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not export invoice image.'));
      }
    }, 'image/png');
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
