import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@cp/shared';

import { ChatService } from './chat.service';
import { ChatConversation } from './chat-conversation.entity';
import { ChatMessage } from './chat-message.entity';
import { User } from '../users/user.entity';

describe('ChatService', () => {
  let service: ChatService;
  let convRepo: Partial<Record<keyof Repository<ChatConversation>, jest.Mock>>;
  let msgRepo: Partial<Record<keyof Repository<ChatMessage>, jest.Mock>>;
  let userRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;

  beforeEach(async () => {
    convRepo = {
      findOneBy: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };
    msgRepo = {
      create: jest.fn((dto) => ({ ...dto, createdAt: new Date() })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'msg_uuid_1', createdAt: new Date() })),
    };
    userRepo = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatConversation), useValue: convRepo },
        { provide: getRepositoryToken(ChatMessage), useValue: msgRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('sendMessage with context (Report feature)', () => {
    it('should save and serialize a report message with structured context fields', async () => {
      const convId = 'conv_123';
      const studentId = 'user_student_1';
      const mockConv = { id: convId, studentId } as ChatConversation;
      const mockSender = { id: studentId, role: UserRole.STUDENT, firstName: 'Alex', lastName: 'Nguyen' } as User;

      convRepo.findOneBy!.mockResolvedValue(mockConv);
      userRepo.findOneBy!.mockResolvedValue(mockSender);

      const result = await service.sendMessage(
        convId,
        studentId,
        UserRole.STUDENT,
        'Báo cáo lỗi câu 2',
        'report',
        undefined,
        'assignment',
        'assign_456',
        'Bài toán hai con trỏ',
        'Khó',
      );

      expect(msgRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: convId,
          senderId: studentId,
          content: 'Báo cáo lỗi câu 2',
          type: 'report',
          contextType: 'assignment',
          contextId: 'assign_456',
          contextTitle: 'Bài toán hai con trỏ',
          contextMeta: 'Khó',
        }),
      );

      expect(result.type).toBe('report');
      expect(result.contextType).toBe('assignment');
      expect(result.contextId).toBe('assign_456');
      expect(result.contextTitle).toBe('Bài toán hai con trỏ');
      expect(result.contextMeta).toBe('Khó');
      expect(result.senderName).toBe('Alex Nguyen');
    });
  });
});
