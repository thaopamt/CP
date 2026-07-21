import { parseReportMessage } from '../apps/web/src/app/lib/chat-report-helper';
import { IChatMessage, UserRole } from '@cp/shared';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- RUNNING REPORT LOGIC VERIFICATION TESTS ---');

// Test 1: Structured Report Message
const structuredMsg: IChatMessage = {
  id: 'msg_1',
  conversationId: 'conv_1',
  senderId: 'user_1',
  senderName: 'Student A',
  senderRole: UserRole.STUDENT,
  senderAvatarUrl: null,
  content: 'Thưa thầy em không hiểu test case 2',
  type: 'report',
  imageUrl: null,
  contextType: 'assignment',
  contextId: 'assignment_123',
  contextTitle: 'Quy hoạch động - Bài 1',
  contextMeta: 'Trung bình',
  readAt: null,
  createdAt: new Date().toISOString(),
};

const res1 = parseReportMessage(structuredMsg);
assert(res1.isReport === true, 'Structured message is identified as report');
assert(res1.type === 'assignment', 'Context type is assignment');
assert(res1.id === 'assignment_123', 'Context ID is assignment_123');
assert(res1.title === 'Quy hoạch động - Bài 1', 'Context title matches');
assert(res1.meta === 'Trung bình', 'Context meta matches');
assert(res1.cleanContent === 'Thưa thầy em không hiểu test case 2', 'Clean content matches input content without tags');

// Test 2: Legacy Tag Message
const legacyMsg: IChatMessage = {
  id: 'msg_2',
  conversationId: 'conv_1',
  senderId: 'user_1',
  senderName: 'Student A',
  senderRole: UserRole.STUDENT,
  senderAvatarUrl: null,
  content: '[📎 Bài tập: Quy hoạch động - Bài 1]\nThưa thầy em không hiểu test case 2',
  type: 'normal',
  imageUrl: null,
  readAt: null,
  createdAt: new Date().toISOString(),
};

const res2 = parseReportMessage(legacyMsg);
assert(res2.isReport === true, 'Legacy tag message is identified as report');
assert(res2.title === 'Quy hoạch động - Bài 1', 'Legacy title extracted correctly');
assert(res2.cleanContent === 'Thưa thầy em không hiểu test case 2', 'Legacy tag stripped from content');

// Test 3: Normal Non-Report Message
const normalMsg: IChatMessage = {
  id: 'msg_3',
  conversationId: 'conv_1',
  senderId: 'user_1',
  senderName: 'Student A',
  senderRole: UserRole.STUDENT,
  senderAvatarUrl: null,
  content: 'Xin chào thầy ạ!',
  type: 'normal',
  imageUrl: null,
  readAt: null,
  createdAt: new Date().toISOString(),
};

const res3 = parseReportMessage(normalMsg);
assert(res3.isReport === false, 'Normal message is not identified as report');
assert(res3.cleanContent === 'Xin chào thầy ạ!', 'Normal message content preserved');

console.log('--- ALL LOGIC VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
