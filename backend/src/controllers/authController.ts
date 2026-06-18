import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as authService from '../services/authService';
import type { RegisterInput, LoginInput } from '../types/auth.types';

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function extractMeta(req: Request): {
  userAgent: string | null;
  ipAddress: string | null;
} {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ipAddress: req.ip ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
//  Controllers (thin — delegate everything to service)
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Public — create a new user account
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = req.body as RegisterInput;
  const result = await authService.register(input, extractMeta(req));

  res
    .status(201)
    .json(new ApiResponse(201, 'Registration successful', result));
});

/**
 * POST /api/v1/auth/login
 * Public — authenticate and receive tokens
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = req.body as LoginInput;
  const result = await authService.login(input, extractMeta(req));

  res
    .status(200)
    .json(ApiResponse.ok('Login successful', result));
});

/**
 * GET /api/v1/auth/me
 * Protected — return current user's profile
 */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await authService.getCurrentUser(req.user.userId);

  res
    .status(200)
    .json(ApiResponse.ok('User profile retrieved', { user }));
});

/**
 * POST /api/v1/auth/refresh
 * Public — rotate refresh token and issue new token pair
 */
export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  const tokenPair = await authService.rotateRefreshToken(refreshToken, extractMeta(req));

  res
    .status(200)
    .json(ApiResponse.ok('Tokens refreshed', tokenPair));
});

/**
 * POST /api/v1/auth/logout
 * Protected — revoke the current session's refresh token
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { refreshToken } = req.body as { refreshToken: string };

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw ApiError.badRequest('refreshToken is required for logout');
  }

  await authService.logout(refreshToken, req.user.userId);

  res
    .status(200)
    .json(ApiResponse.ok('Logged out successfully', null));
});
