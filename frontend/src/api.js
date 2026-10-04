const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

async function apiRequest(path, { method = "GET", body, headers } = {}) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  };

  if (body !== undefined && body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({ message: response.statusText }))
    : await response.text();

  if (!response.ok) {
    const detail = payload?.detail;
    let message = "Unable to process the request.";

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item) => item.msg || item.loc?.join("."))
        .filter(Boolean)
        .join("; ");
    } else if (payload && typeof payload === "object") {
      message = payload.error || payload.message || message;
    }

    throw new Error(message);
  }

  return payload;
}

function getFriendlyErrorMessage(error) {
  const message = error?.message || "Something went wrong.";

  if (/network|fetch/i.test(message)) {
    return "Unable to reach the backend. Make sure the FastAPI server is running.";
  }

  if (/404/i.test(message)) {
    return "The requested resource could not be found.";
  }

  if (/422|validation/i.test(message)) {
    return "Please check the form values and try again.";
  }

  if (/500|database/i.test(message)) {
    return "The server is currently unavailable. Please try again shortly.";
  }

  return message;
}

export { API_BASE_URL, apiRequest, getFriendlyErrorMessage };
