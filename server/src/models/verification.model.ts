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
    createdAt!: Date; 

    @Column({type: "enum" ,enum: verifiedCodeType})
    type!: verifiedCodeType;

    @ManyToOne(()=> User, (user) => user.verifiedCodes)
    user!: User;
}