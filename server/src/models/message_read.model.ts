import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from './users.model';
import { Message } from './message.model';

@Entity('MessageRead')
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