export async function submitEnquiry(payload: Record<string, string>) {
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    throw new Error("Google Script URL is not defined.");
  }

  const formData = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return fetch(scriptUrl, {
    method: "POST",
    body: formData,
    mode: "no-cors",
  });
}
