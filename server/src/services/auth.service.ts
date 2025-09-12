import { User } from "@/models/users.model"
import { loginDTOResponse } from '@/DTOs/auth.dto'
import { Repository } from "typeorm"
import { AppDataSource } from "@/configs/database.config";
import { AppError } from '@/utils/error.response'
import jwt from 'jsonwebtoken'
import { hashPassword, passwordCompare } from '@/utils/password'
import { VerifiedCode } from '@/models/verification.model'
import dayjs from "dayjs";
import { verifiedCodeType } from '@/constants/constants'
class authService {
    private userRepository: Repository<User>;
    private verifiedCodeRepository: Repository<VerifiedCode>
    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.verifiedCodeRepository = AppDataSource.getRepository(VerifiedCode);
    }
}
export default new authService()