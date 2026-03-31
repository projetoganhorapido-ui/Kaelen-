exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método não permitido" }) };
  }

  try {
    const { amount } = JSON.parse(event.body);

    if (!amount || amount < 1) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Valor inválido" }) };
    }

    const amountInCents = Math.round(amount);
    const identifier = "kerllen-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6);

    const PUBLIC_KEY = process.env.SIGILOPAY_PUBLIC_KEY;
    const SECRET_KEY = process.env.SIGILOPAY_SECRET_KEY;

    const payload = {
      amount: amountInCents,
      identifier: identifier,
      client: {
        name: "Doador",
        document: "03762171203",
        email: "doador@kerllen.com",
        phone: "11999999999",
      },
    };

    const response = await fetch("https://app.sigilopay.com.br/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": PUBLIC_KEY,
        "x-secret-key": SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("SigiloPay error:", JSON.stringify(data));
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "Erro ao gerar PIX", details: data }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        qrcode: data.qrcode || data.pix_qrcode || data.qr_code,
        qrcode_url: data.qrcode_url || data.pix_qrcode_url || data.qr_code_url,
        txid: data.txid || data.id || identifier,
        amount: amount,
      }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erro interno", details: err.message }),
    };
  }
};
