/**
 * ✅ Security Fix #8: Error message sanitization utility
 * 
 * Memastikan hanya pesan error yang aman yang dikirim ke client.
 * Pesan error database/internal tidak akan bocor ke end-user.
 */

/** 
 * Pesan error yang aman untuk ditampilkan ke user.
 * Tambahkan pesan baru di sini jika diperlukan.
 */
const SAFE_ERROR_PREFIXES = [
    // Attendance
    "Already checked in",
    "Prayer time not found",
    "Waktu sholat belum",
    "Sudah absen",

    // Permits
    "Permit not found",
    "Invalid status",

    // Auth / Code
    "Invalid or inactive access code",
    "Access code has expired",
    "Access code is not assigned",
    "User associated with this code not found",
    "User account is not active",

    // User
    "User not found",
    "Access code already exists",

    // Export
    "Export record not found",
    "Invalid file path",

    // Generic validation
    "Missing required fields",
    "required",
    "not found",
    "already exists",
];

/**
 * Sanitize an error message for safe client consumption.
 * Returns the original message if it matches a known safe pattern,
 * otherwise returns a generic fallback message.
 */
export function sanitizeErrorMessage(error: any, fallbackMessage: string = "Terjadi kesalahan pada server"): string {
    const message = error?.message || "";

    // Check if the error message starts with any known safe prefix
    for (const prefix of SAFE_ERROR_PREFIXES) {
        if (message.toLowerCase().includes(prefix.toLowerCase())) {
            return message;
        }
    }

    // In development, return full message for debugging
    if (process.env.NODE_ENV !== "production") {
        return message;
    }

    // In production, return generic message
    return fallbackMessage;
}
