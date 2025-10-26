import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from './users.model';
import { Message } from './message.model';

// Use snake_case table name to match the existing DB table created earlier
@Entity('message_read')
export class MessageRead {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'messageId' })
  message!: Message;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  readAt!: Date;
}