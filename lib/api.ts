export async function submitEnquiry(payload: Record<string, string>) {
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    throw new Error("Google Script URL is not defined.");
  }

  return fetch(scriptUrl, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
}
