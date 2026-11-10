import { User } from '../entity/user.entity';

export class UserResponseDTO {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name;
        this.avatarUrl = user.avatarUrl;
        this.createdAt = user.createdAt;
    }
}

export class UserProfileUpdateResponseDTO {
    message: string;
    user: UserResponseDTO;

    constructor(message: string, user: User) {
        this.message = message;
        this.user = new UserResponseDTO(user);
    }
}

export class DeleteUserResponseDTO {
    message: string;

    constructor(message: string) {
        this.message = message;
    }
}

