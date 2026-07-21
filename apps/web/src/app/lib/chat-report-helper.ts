import { IChatMessage } from '@cp/shared';

export interface ReportContextInfo {
  isReport: boolean;
  type: string;
  id?: string;
  title: string;
  meta?: string;
  cleanContent: string;
}

/**
 * Parses a chat message to detect whether it is an assignment report/Q&A,
 * extracting structured context (assignment title, ID, difficulty)
 * and legacy [📎 ...] tags.
 */
export function parseReportMessage(msg: IChatMessage): ReportContextInfo {
  if (msg.type === 'report' || msg.contextTitle || msg.contextId) {
    return {
      isReport: true,
      type: msg.contextType || 'assignment',
      id: msg.contextId || undefined,
      title: msg.contextTitle || 'Bài tập',
      meta: msg.contextMeta || undefined,
      cleanContent: msg.content,
    };
  }

  // Legacy fallback for messages formatted like [📎 Bài tập: Title]
  const legacyMatch = msg.content.match(
    /^\[📎\s*([^:]+):\s*([^\]]+)\](?:\n+)?([\s\S]*)?$/
  );
  if (legacyMatch) {
    return {
      isReport: true,
      type: 'assignment',
      title: legacyMatch[2].trim(),
      cleanContent: (legacyMatch[3] || '').trim() || msg.content,
    };
  }

  return {
    isReport: false,
    type: '',
    title: '',
    cleanContent: msg.content,
  };
}
