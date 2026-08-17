export function buildWhatsAppShareUrl(mobile: string | null | undefined, message: string) {
  const text = encodeURIComponent(message);
  const digits = (mobile ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `https://wa.me/91${digits}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

export function isWhatsAppApiConfigured() {
  return Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);
}
