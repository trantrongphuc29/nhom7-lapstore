import { notifyUnauthorizedSession } from "../utils/authSession";

export async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  notifyUnauthorizedSession(response, options);
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}
