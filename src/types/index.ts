/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'en';

export type MessageStatus = 'answered' | 'red_flag' | 'refused' | 'error';

export type FontFamily = 'cairo' | 'alexandria' | 'amiri' | 'system';
export type TextSize = 'normal' | 'large' | 'xlarge';
export type PageTheme = 'light' | 'dark' | 'high-contrast' | 'soft';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  status?: MessageStatus;
  seconds?: number;
  model?: string;
  triggerType?: string;
  matchedPattern?: string;
  citation?: {
    source: string;
    passageAr: string;
    passageEn: string;
  };
  reported?: boolean;
  reportReason?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SafetyCheckResult {
  status: 'safe' | 'red_flag' | 'refused';
  reply: string | null;
  triggerType?: string;
  matchedPattern?: string;
  seconds?: number;
}

export interface EmergencyContact {
  country: string;
  code: string;
  ambulance: string;
  police: string;
  fire: string;
  hotline?: string;
  poisonControl?: string;
}

export interface TriageLevel {
  level: number;
  titleAr: string;
  titleEn: string;
  color: string;
  bgLight: string;
  border: string;
  actionAr: string;
  actionEn: string;
  examplesAr: string[];
  examplesEn: string[];
}
