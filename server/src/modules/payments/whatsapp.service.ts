import fetch from 'node-fetch';

/**
 * Sends a WhatsApp text message using the WhatsApp Business Cloud API.
 * This is a lightweight wrapper; in production you may want more robust error handling.
 */
export async function sendWhatsAppMessage(token: string, phoneId: string, message: string): Promise<void> {
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: phoneId,
    type: 'text',
    text: { body: message },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} ${err}`);
  }
}
