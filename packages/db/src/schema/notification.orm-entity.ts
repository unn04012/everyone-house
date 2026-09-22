import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export enum NotificationChannelEnum {
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
}
export type NotificationChannel = keyof typeof NotificationChannelEnum;

export enum NotificationStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
}
export type NotificationStatus = keyof typeof NotificationStatusEnum;

/** 발송 로그. 같은 match 를 두 번 알리지 않기 위한 근거이기도 하다. */
@Entity({ name: 'notifications' })
@Index(['matchId', 'channel'], { unique: true })
export class NotificationOrmEntity {
  @PrimaryColumn({ type: 'uuid', name: 'notification_id' })
  notificationId!: string;

  @Column({ type: 'uuid', name: 'match_id' })
  matchId!: string;

  @Column({ type: 'enum', enum: NotificationChannelEnum })
  channel!: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationStatusEnum })
  status!: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'sent_at' })
  sentAt!: Date;
}
