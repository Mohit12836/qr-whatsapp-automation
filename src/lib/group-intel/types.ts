export interface GroupMessageEvent {
  messageId: string;
  groupId: string;
  groupName: string;
  anonymizedSenderHash: string; // Hash of sender phone (never store raw personal numbers for cold spam)
  text: string;
  timestamp: string;
}

export type IntentCategory = 'buying_intent' | 'supplier_inquiry' | 'price_check' | 'troubleshooting' | 'general_chat';

export interface DemandSignal {
  id: string;
  groupId: string;
  groupName: string;
  intentCategory: IntentCategory;
  confidenceScore: number;
  matchedKeywords: string[];
  anonymizedSenderHash: string;
  snippet: string;
  detectedAt: string;
}

export interface GroupTopicCluster {
  topicId: string;
  title: string;
  category: IntentCategory;
  frequency: number;
  sampleQuestions: string[];
  recommendedAction: string;
}

export interface CommunityRadarMetrics {
  monitoredGroupsCount: number;
  estimatedMemberReach: number;
  totalSignalsDetected: number;
  highIntentSignalsCount: number;
  topTopics: GroupTopicCluster[];
}
