import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function mapError(code: string, lang: "fa" | "en" = "fa"): string {
  const fa: Record<string, string> = {
    username_exists: "این نام کاربری قبلاً استفاده شده است.",
    invalid_username:
      "نام کاربری باید ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد.",
    registration_disabled: "ثبت‌نام در حال حاضر غیرفعال است.",
    not_authenticated: "لطفاً ابتدا وارد حساب شوید.",
    permission_denied: "دسترسی به این بخش را ندارید.",
    invalid_password: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
    banned: "حساب شما مسدود شده است.",
    not_found: "مورد درخواستی پیدا نشد.",
    already_member: "شما عضو این گفتگو هستید.",
    invite_invalid: "لینک دعوت نامعتبر است.",
    conversation_private: "این گفتگو خصوصی است.",
    username_taken: "این نام کانال قبلاً گرفته شده است.",
    unknown: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
  };
  const en: Record<string, string> = {
    username_exists: "This username is already taken.",
    invalid_username:
      "Username must be 3–20 characters: English letters, digits, or _.",
    registration_disabled: "Registration is currently disabled.",
    not_authenticated: "Please sign in first.",
    permission_denied: "You do not have access to this section.",
    invalid_password: "Password must be at least 6 characters.",
    banned: "Your account is blocked.",
    not_found: "Not found.",
    already_member: "You are already a member.",
    invite_invalid: "This invite link is invalid.",
    conversation_private: "This conversation is private.",
    username_taken: "This channel username is taken.",
    unknown: "Something went wrong. Please try again.",
  };
  const table = lang === "en" ? en : fa;
  return table[code] ?? table.unknown;
}
