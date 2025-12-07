/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

interface LoginAttempt {
  count: number
  lockoutUntil: number | null
}

// In-memory store for login attempts (email-based tracking)
const loginAttempts = new Map<string, LoginAttempt>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Record a failed login attempt for an email
 */
export function recordFailedAttempt (email: string): void {
  const normalizedEmail = email.toLowerCase()
  const attempt = loginAttempts.get(normalizedEmail) || { count: 0, lockoutUntil: null }
  
  attempt.count++
  
  // If max attempts reached, set lockout time
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS
  }
  
  loginAttempts.set(normalizedEmail, attempt)
}

/**
 * Reset login attempts for an email (called on successful login)
 */
export function resetAttempts (email: string): void {
  const normalizedEmail = email.toLowerCase()
  loginAttempts.delete(normalizedEmail)
}

/**
 * Check if an email is currently locked out
 * Returns true if locked out, false otherwise
 */
export function isLockedOut (email: string): boolean {
  const normalizedEmail = email.toLowerCase()
  const attempt = loginAttempts.get(normalizedEmail)
  
  if (!attempt || attempt.lockoutUntil === null) {
    return false
  }
  
  // Check if lockout has expired
  if (Date.now() >= attempt.lockoutUntil) {
    // Lockout expired, reset attempts
    loginAttempts.delete(normalizedEmail)
    return false
  }
  
  return true
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockoutTime (email: string): number {
  const normalizedEmail = email.toLowerCase()
  const attempt = loginAttempts.get(normalizedEmail)
  
  if (!attempt || attempt.lockoutUntil === null) {
    return 0
  }
  
  const remaining = Math.ceil((attempt.lockoutUntil - Date.now()) / 1000)
  return remaining > 0 ? remaining : 0
}

/**
 * Get the number of remaining attempts before lockout
 */
export function getRemainingAttempts (email: string): number {
  const normalizedEmail = email.toLowerCase()
  const attempt = loginAttempts.get(normalizedEmail)
  
  if (!attempt || isLockedOut(email)) {
    return 0
  }
  
  return Math.max(0, MAX_ATTEMPTS - attempt.count)
}
