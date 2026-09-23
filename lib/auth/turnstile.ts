export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // تجاوز الفحص في بيئة التطوير إذا كان المفتاح Dummy أو مفقود
  if (!secretKey || secretKey.includes("dummy") || secretKey.startsWith("1x0000000000000000000000000000000AA")) {
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const outcome = await result.json();
    return outcome.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}