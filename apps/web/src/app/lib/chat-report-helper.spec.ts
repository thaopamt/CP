import { IChatMessage, UserRole } from '@cp/shared';
import { parseReportMessage } from './chat-report-helper';

describe('parseReportMessage', () => {
  const baseMessage: IChatMessage = {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user_1',
    senderName: 'Test Student',
    senderRole: UserRole.STUDENT,
    senderAvatarUrl: null,
    content: 'Em thắc mắc câu 1',
    type: 'normal',
    imageUrl: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  };

  it('should parse structured report message correctly', () => {
    const reportMsg: IChatMessage = {
      ...baseMessage,
      type: 'report',
      contextType: 'assignment',
      contextId: 'assign_123',
      contextTitle: 'Bài toán hai con trỏ',
      contextMeta: 'Dễ',
      content: 'Thưa thầy bài này bị lỗi test case ạ',
    };

    const result = parseReportMessage(reportMsg);

    expect(result.isReport).toBe(true);
    expect(result.type).toBe('assignment');
    expect(result.id).toBe('assign_123');
    expect(result.title).toBe('Bài toán hai con trỏ');
    expect(result.meta).toBe('Dễ');
    expect(result.cleanContent).toBe('Thưa thầy bài này bị lỗi test case ạ');
  });

  it('should parse legacy tag formatted message correctly', () => {
    const legacyMsg: IChatMessage = {
      ...baseMessage,
      type: 'normal',
      content: '[📎 Bài tập: Bài toán hai con trỏ]\nThưa thầy bài này bị lỗi test case ạ',
    };

    const result = parseReportMessage(legacyMsg);

    expect(result.isReport).toBe(true);
    expect(result.type).toBe('assignment');
    expect(result.title).toBe('Bài toán hai con trỏ');
    expect(result.cleanContent).toBe('Thưa thầy bài này bị lỗi test case ạ');
  });

  it('should return isReport=false for normal messages without tags or context', () => {
    const normalMsg: IChatMessage = {
      ...baseMessage,
      content: 'Chào thầy ạ',
    };

    const result = parseReportMessage(normalMsg);

    expect(result.isReport).toBe(false);
    expect(result.cleanContent).toBe('Chào thầy ạ');
  });
});
