import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from './users.model';
import { Message } from './message.model';

// Use snake_case table name to match the existing DB table created earlier
@Entity({ name: 'message_read' })
export class MessageRead {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'messageid' })
  message!: Message;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user!: User;

  @CreateDateColumn({ name: 'readat' })
  readAt!: Date;
}