import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repo';
import { UserAlreadyExistError } from '../../auth/errors';
import { hashPassword } from '../../auth/utils';
import { UserNotFoundError } from '../errors';
import { User } from '../entity/user.entity';
import {
    DeleteUserResponseDTO,
    UserProfileUpdateResponseDTO,
    UserResponseDTO,
} from '../dto/user.response.dto';

export interface CreateUserData {
    email: string;
    name: string;
    password?: string;
    googleId?: string | null;
    avatarUrl?: string | null;
}

@Injectable()
export class UserService {
    constructor(@Inject(UserRepository) private readonly userRepo: UserRepository) {}

    create = async (data: CreateUserData): Promise<User> => {
        const existing = await this.userRepo.findUserByEmail(data.email);
        if (existing) {
            throw UserAlreadyExistError;
        }

        const hashedPassword = data.password ? await hashPassword(data.password) : null;

        return await this.userRepo.createUser({
            name: data.name,
            email: data.email,
            passwordHash: hashedPassword,
            googleId: data.googleId ?? null,
            avatarUrl: data.avatarUrl ?? null,
        });
    };

    getByUserId = async (userId: string): Promise<UserResponseDTO> => {
        const user = await this.userRepo.findUserById(userId);
        if (!user) throw UserNotFoundError;
        return new UserResponseDTO(user);
    };

    updateUserProfile = async (
        userId: string,
        data: { name: string; avatarUrl?: string }
    ): Promise<UserProfileUpdateResponseDTO> => {
        const updated = await this.userRepo.updateUserProfile(userId, data);
        if (!updated) throw UserNotFoundError;
        return new UserProfileUpdateResponseDTO('User profile updated successfully', updated);
    };

    deleteAccount = async (userId: string): Promise<DeleteUserResponseDTO> => {
        const deleted = await this.userRepo.deleteUserById(userId);
        if (!deleted) throw UserNotFoundError;
        return new DeleteUserResponseDTO('Account deleted successfully');
    };
}
