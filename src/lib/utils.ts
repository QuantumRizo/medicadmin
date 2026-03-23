import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function standardizePhone(phone: string): string {
    if (!phone) return "";
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");
    // In Mexico, we only care about the last 10 digits to handle +52 etc.
    return digits.length > 10 ? digits.slice(-10) : digits;
}
