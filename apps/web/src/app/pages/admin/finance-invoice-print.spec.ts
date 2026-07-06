import { describe, expect, it } from 'vitest';

import {
  buildTuitionInvoiceHtml,
  buildTuitionInvoiceImageFilename,
  buildTuitionInvoiceImageSvg,
  buildVietQrPayload,
} from './finance-invoice-print';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const row = {
  profileId: 'profile-123456789',
  studentId: 'student-1',
  studentName: 'Binh Nguyen',
  email: 'binh@example.com',
  grade: 8,
  classNames: ['Tin'],
  scheduledSessions: 8,
  billableSessions: 8,
  defaultMonthlyTuition: 500000,
  monthlyTuition: 500000,
  tuitionPerSession: 62500,
  calculatedAmountDue: 500000,
  amountDue: 500000,
  amountDueOverride: null,
  hasAmountDueOverride: false,
  hasAssignedTeacher: false,
  missingTuitionConfig: false,
  billingStatus: 'READY' as const,
  collectionStatus: 'PENDING' as const,
};

describe('buildTuitionInvoiceHtml', () => {
  it('renders the print invoice in the transfer-reminder layout', () => {
    const html = buildTuitionInvoiceHtml({
      row,
      month: '2026-04',
      from: '01/04/2026',
      to: '30/04/2026',
      issuedAt: '07/07/2026',
      money,
      status: 'Da in',
    });

    expect(html).not.toContain('THẦY PHÚ');
    expect(html).not.toContain('DẠY KÈM TOÁN - TIN');
    expect(html).not.toContain('0934.972.909');
    expect(html).not.toContain('LỚP TOÁN - TIN');
    expect(html).not.toContain('T.PHÚ');
    expect(html).toContain('Kính gửi phụ huynh em: <strong>Binh Nguyen</strong>');
    expect(html).toContain('Lớp: <strong>Tin</strong>');
    expect(html).toContain('HP tháng <strong>04/2026</strong>: <strong>500.000&nbsp;₫</strong>');
    expect(html).toContain('PH chuyển khoản theo số tài khoản bên cạnh!');
    expect(html).toContain('class="invoice-divider"');
    expect(html).toContain('Chủ TK: <strong>HKD_KCCT</strong>');
    expect(html).toContain('Số TK: <strong>040130524070</strong>');
    expect(html).toContain('Ngân hàng: <strong>Sacombank</strong>');
    expect(html).toMatch(/\.invoice-main\s*\{[^}]*justify-content:\s*center;/);
    expect(html).toMatch(/\.message\s*\{[^}]*justify-items:\s*start;/);
    expect(html).toMatch(/\.message\s*\{[^}]*text-align:\s*left;/);
    expect(html).toMatch(/\.bank-details\s*\{[^}]*text-align:\s*center;/);
    expect(html.indexOf('class="bank-details"')).toBeGreaterThan(html.indexOf('class="qr-shell"'));
    expect(html).toContain('@page { size: A4 landscape; margin: 10mm; }');
  });

  it('escapes student-provided content before writing it to the print window', () => {
    const html = buildTuitionInvoiceHtml({
      row: {
        ...row,
        studentName: '<script>alert(1)</script>',
        classNames: ['Tin & Toan'],
      },
      month: '2026-04',
      from: '01/04/2026',
      to: '30/04/2026',
      issuedAt: '07/07/2026',
      money,
      status: 'Da in',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Tin &amp; Toan');
  });
});

describe('buildTuitionInvoiceImageFilename', () => {
  it('creates a png filename safe for sending to parents', () => {
    expect(buildTuitionInvoiceImageFilename(row, '2026-04')).toBe(
      'hoa-don-hoc-phi-binh-nguyen-2026-04.png',
    );
  });
});

describe('buildVietQrPayload', () => {
  it('builds a bank-transfer payload with account, amount, memo, and CRC', () => {
    const payload = buildVietQrPayload(row, '2026-04');

    expect(payload).toContain('A000000727');
    expect(payload).toContain('970403');
    expect(payload).toContain('040130524070');
    expect(payload).toContain('5303704');
    expect(payload).toContain('5406500000');
    expect(payload).toContain('HP Binh Nguyen 2026-04');
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });
});

describe('buildTuitionInvoiceImageSvg', () => {
  it('wraps the invoice in a self-contained SVG image document', () => {
    const svg = buildTuitionInvoiceImageSvg({
      row,
      month: '2026-04',
      from: '01/04/2026',
      to: '30/04/2026',
      issuedAt: '07/07/2026',
      money,
      status: 'Da in',
      qrImageUrl: 'data:image/png;base64,qr',
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('<foreignObject');
    expect(svg).toContain('data:image/png;base64,qr');
    expect(svg).toContain('Chủ TK: <strong>HKD_KCCT</strong>');
    expect(svg).toContain('Số TK: <strong>040130524070</strong>');
    expect(svg).toContain('Ngân hàng: <strong>Sacombank</strong>');
    expect(svg).not.toContain('THẦY PHÚ');
    expect(svg).not.toContain('LỚP TOÁN - TIN');
  });
});
