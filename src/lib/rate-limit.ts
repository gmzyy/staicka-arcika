type RateLimitInfo = {
    count: number;
    resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitInfo>();
const LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

export function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const info = rateLimitMap.get(ip);

    if (!info) {
        // Primera petición
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return true;
    }

    if (now > info.resetTime) {
        // El tiempo expiró, resetear conteo
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return true;
    }

    if (info.count < LIMIT) {
        // Incrementa la petición
        info.count += 1;
        return true;
    }

    // Excedió el límite
    return false;
}
