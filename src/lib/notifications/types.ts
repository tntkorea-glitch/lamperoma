export type NotificationChannel = "inapp" | "email" | "sms" | "kakao";

export interface NotificationPayload {
  userId: string;
  email?: string;
  phone?: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  templateData?: Record<string, string>;
}

export interface DeliveryResult {
  channel: NotificationChannel;
  delivered: boolean;
  skipped?: boolean;
  reason?: string;
  providerId?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<DeliveryResult>;
}
