export async function sendAlert(message: string) {
  const webhook = process.env.ALERT_WEBHOOK_URL;
  if (!webhook) {
    console.warn("ALERT_WEBHOOK_URL not set; alert message:", message);
    return;
  }
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, content: message })
    });
  } catch (err) {
    console.error("Failed to send alert", err);
  }
}
