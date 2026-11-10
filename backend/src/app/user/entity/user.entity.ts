export class User {
    id: string;
    email: string;
    name: string;
    passwordHash: string | null;
    googleId: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<User>) {
        this.id = data.id!;
        this.email = data.email!;
        this.name = data.name!;
        this.passwordHash = data.passwordHash ?? null;
        this.googleId = data.googleId ?? null;
        this.avatarUrl = data.avatarUrl ?? null;
        this.createdAt = data.createdAt ?? new Date();
        this.updatedAt = data.updatedAt ?? new Date();
    }
}

