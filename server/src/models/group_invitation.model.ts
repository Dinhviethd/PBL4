import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { Group } from './group.model';
import { User } from './users.model';

@Entity('Group_Invitation')
export class GroupInvitation {
  @PrimaryGeneratedColumn()
  idInvitation!: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'idGroup' })
  idGroup!: Group;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter' })
  inviter!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee' })
  invitee!: User;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'boolean', default: false })
  needAdminApprove!: boolean;
}
