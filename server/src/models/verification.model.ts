import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, CreateDateColumn } from 'typeorm'
import { verifiedCodeType } from '@/constants/constants'
import { User } from './users.model'
@Entity()
export class VerifiedCode{
    @PrimaryGeneratedColumn()
    idVerifiedCode!: number;

    @Column()
    ExpiredAt!: Date

    @CreateDateColumn({ 
        type: "timestamp", 
        default: () => "CURRENT_TIMESTAMP(6)", 
    })
    CreatedAt!: Date; 

    @Column({type: "enum" ,enum: verifiedCodeType})
    type!: verifiedCodeType;

    @Column({ nullable: true })
    code?: string;

    @ManyToOne(()=> User, (user) => user.verifiedCodes)
    user!: User;
}