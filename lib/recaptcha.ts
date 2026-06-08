const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

type RecaptchaVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

type RecaptchaResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string; status: number };

export async function verifyRecaptchaToken(
  token: string,
  remoteIp?: string | null,
): Promise<RecaptchaResult> {
  if (!token) {
    return { ok: false, error: "Please complete the reCAPTCHA.", status: 400 };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Form verification is not configured.", status: 503 };
    }
    return { ok: true, skipped: true };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      return { ok: false, error: "Could not verify reCAPTCHA.", status: 502 };
    }

    const result = (await response.json()) as RecaptchaVerifyResponse;
    if (!result.success) {
      return { ok: false, error: "Please complete the reCAPTCHA again.", status: 400 };
    }

    return { ok: true };
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return { ok: false, error: "Could not verify reCAPTCHA.", status: 502 };
  }
}
