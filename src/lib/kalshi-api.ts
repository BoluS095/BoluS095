import type {
  KalshiBalance,
  KalshiCredentials,
  KalshiEvent,
  KalshiMarket,
  KalshiOrder,
  KalshiOrderBook,
  KalshiPosition,
} from "./types";
import { KALSHI_BASE_URL } from "./constants";

// ─── RSA-PSS Signature Generation ───────────────────────────────
// Uses jsrsasign for browser-compatible RSA-PSS signing
async function generateSignature(
  timestamp: number,
  method: string,
  path: string,
  privateKeyPem: string
): Promise<string> {
  // Import the private key from PEM
  const pemBody = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSA-PSS", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const message = `${timestamp}${method}${path}`;
  const encoded = new TextEncoder().encode(message);

  const signature = await crypto.subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    privateKey,
    encoded
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// ─── API Request Helper ─────────────────────────────────────────
async function kalshiRequest<T>(
  credentials: KalshiCredentials,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const timestamp = Date.now();
  const signature = await generateSignature(
    timestamp,
    method.toUpperCase(),
    path,
    credentials.privateKeyPem
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "KALSHI-ACCESS-KEY": credentials.apiKeyId,
    "KALSHI-ACCESS-TIMESTAMP": String(timestamp),
    "KALSHI-ACCESS-SIGNATURE": signature,
  };

  const url = `${KALSHI_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: method.toUpperCase(),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kalshi API ${response.status}: ${errorText}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── Public API Methods ─────────────────────────────────────────

export async function getBalance(
  credentials: KalshiCredentials
): Promise<KalshiBalance> {
  const res = await kalshiRequest<{ balance: number; balance_available: number; positions: [] }>(
    credentials,
    "GET",
    "/portfolio/balance"
  );
  return {
    balance: res.balance,
    total_deposited: 0,
    total_withdrawn: 0,
    total_settled: 0,
    total_fees: 0,
    pending_balance: res.balance - res.balance_available,
  };
}

export async function getPositions(
  credentials: KalshiCredentials
): Promise<KalshiPosition[]> {
  const res = await kalshiRequest<{ market_positions: KalshiPosition[] }>(
    credentials,
    "GET",
    "/portfolio/positions"
  );
  return res.market_positions || [];
}

export async function getMarkets(
  credentials: KalshiCredentials,
  limit = 100,
  cursor?: string
): Promise<{ markets: KalshiMarket[]; cursor: string }> {
  let path = `/markets?limit=${limit}&status=open`;
  if (cursor) path += `&cursor=${cursor}`;
  return kalshiRequest<{ markets: KalshiMarket[]; cursor: string }>(
    credentials,
    "GET",
    path
  );
}

export async function getMarket(
  credentials: KalshiCredentials,
  ticker: string
): Promise<KalshiMarket> {
  const res = await kalshiRequest<{ market: KalshiMarket }>(
    credentials,
    "GET",
    `/markets/${ticker}`
  );
  return res.market;
}

export async function getOrderBook(
  credentials: KalshiCredentials,
  ticker: string
): Promise<KalshiOrderBook> {
  const res = await kalshiRequest<{ orderbook: KalshiOrderBook }>(
    credentials,
    "GET",
    `/markets/${ticker}/orderbook`
  );
  return res.orderbook;
}

export async function placeOrder(
  credentials: KalshiCredentials,
  params: {
    ticker: string;
    action: "buy" | "sell";
    side: "yes" | "no";
    type: "limit" | "market";
    count: number;
    price?: number;
  }
): Promise<KalshiOrder> {
  const body: Record<string, unknown> = {
    ticker: params.ticker,
    action: params.action,
    side: params.side,
    type: params.type,
    count: params.count,
  };

  if (params.type === "limit" && params.price !== undefined) {
    body.price = params.price;
  }

  const res = await kalshiRequest<{ order: KalshiOrder }>(
    credentials,
    "POST",
    "/portfolio/orders",
    body
  );
  return res.order;
}

export async function cancelOrder(
  credentials: KalshiCredentials,
  orderId: string
): Promise<void> {
  await kalshiRequest(
    credentials,
    "DELETE",
    `/portfolio/orders/${orderId}`
  );
}

export async function getOpenOrders(
  credentials: KalshiCredentials
): Promise<KalshiOrder[]> {
  const res = await kalshiRequest<{ orders: KalshiOrder[] }>(
    credentials,
    "GET",
    "/portfolio/orders?status=resting"
  );
  return res.orders || [];
}

export async function getEvents(
  credentials: KalshiCredentials,
  limit = 50
): Promise<KalshiEvent[]> {
  const res = await kalshiRequest<{ events: KalshiEvent[] }>(
    credentials,
    "GET",
    `/events?limit=${limit}&status=open`
  );
  return res.events || [];
}

// ─── WebSocket Connection ───────────────────────────────────────
export function createKalshiWS(
  _credentials: KalshiCredentials,
  onMessage: (data: unknown) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(
    "wss://external-api-ws.kalshi.com/trade-api/ws/v2"
  );

  ws.onopen = () => {
    // Subscribe to orderbook updates for watchlist
    ws.send(
      JSON.stringify({
        type: "subscribe",
        channel: "orderbook_delta",
        tickers: ["*"],
      })
    );
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string);
      onMessage(data);
    } catch {
      // Ignore parse errors
    }
  };

  ws.onerror = onError || (() => {});
  ws.onclose = onClose || (() => {});

  return ws;
}
