import { AppError } from '../../lib/error/AppError';

export const UserAlreadyExistError = new AppError('User already exists with the same email', 400);
export const IncorrectCredentials = new AppError('Incorrect Email or Password', 401);
export const AccountRegisteredWithGoogle = new AppError(
    'This email is registered with Google. Please sign in with Google or reset your password.',
    400
);
export const EmailNotRegisteredError = new AppError(
    'No account found with this email address',
    404
);
export const InvalidOrExpiredOTP = new AppError('Invalid or expired OTP', 401);
export const OTPNotVerifiedError = new AppError(
    'Please verify your OTP before resetting your password',
    400
);
export const PasswordsDoNotMatchError = new AppError(
    'New password and confirm password do not match',
    400
);
export const NoRefreshTokenFound = new AppError('No refresh token found', 404);
export const GoogleAuthFailedError = new AppError('Google authentication failed', 400);

