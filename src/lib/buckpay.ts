export interface BuckPayTransactionResponse {
  data: {
    id: string;
    status: "pending" | "paid" | "canceled";
    payment_method: "pix";
    pix?: {
      code: string;
      qrcode_base64: string;
    };
    total_amount: number;
    net_amount: number;
    created_at: string;
  };
}

const BUCKPAY_BASE_URL = "https://api.realtechdev.com.br";

const getBuckPayToken = () => import.meta.env.VITE_BUCKPAY_TOKEN as string | undefined;
const getBuckPayUserAgent = () => import.meta.env.VITE_BUCKPAY_USER_AGENT as string | undefined;

export const createBuckPayTransaction = async (payload: Record<string, unknown>) => {
  const token = getBuckPayToken();
  if (!token) {
    throw new Error("VITE_BUCKPAY_TOKEN não configurado.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const userAgent = getBuckPayUserAgent();
  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  const response = await fetch(`${BUCKPAY_BASE_URL}/v1/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Erro ao criar transação.");
  }

  return (await response.json()) as BuckPayTransactionResponse;
};

export const getBuckPayTransactionByExternalId = async (externalId: string) => {
  const token = getBuckPayToken();
  if (!token) {
    throw new Error("VITE_BUCKPAY_TOKEN não configurado.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const userAgent = getBuckPayUserAgent();
  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  const response = await fetch(
    `${BUCKPAY_BASE_URL}/v1/transactions/external_id/${externalId}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Erro ao consultar transação.");
  }

  return (await response.json()) as BuckPayTransactionResponse;
};
