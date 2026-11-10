export class PasswordReset {
    id: string;
    userId: string;
    email: string;
    otpHash: string;
    verifiedAt: Date | null;
    consumedAt: Date | null;
    createdAt: Date;
    expiresAt: Date;

    constructor(data: Partial<PasswordReset>) {
        this.id = data.id!;
        this.userId = data.userId!;
        this.email = data.email!;
        this.otpHash = data.otpHash!;
        this.verifiedAt = data.verifiedAt ?? null;
        this.consumedAt = data.consumedAt ?? null;
        this.createdAt = data.createdAt!;
        this.expiresAt = data.expiresAt!;
    }

    isExpired(): boolean {
        return this.expiresAt < new Date();
    }
}

