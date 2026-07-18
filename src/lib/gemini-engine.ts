import type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  KalshiMarket,
} from "./types";
import { GEMINI_BASE_URL, GEMINI_MODEL } from "./constants";

// ─── Gemini API Call ────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

// ─── System Instructions ────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are Kalshi Nexus AI, an elite autonomous trading intelligence system specialized in Kalshi event contracts. You analyze market data, order books, portfolio positions, and trade history to make optimal trading decisions.

Your core principles:
1. MAXIMIZE expected value on every trade - only enter when edge exists
2. MANAGE risk rigorously - never risk more than the allocated position size
3. LEVERAGE micro-capital optimization - with $10 starting capital, every cent matters
4. ACCOUNT for Kalshi fees (varies by tier) in all calculations
5. DIVERSIFY across uncorrelated markets when possible
6. EXIT positions that no longer have favorable expected value

You must respond with valid JSON matching the exact schema specified. Be decisive, data-driven, and optimized for small capital accounts.`;

// ─── Analysis Prompt Builder ────────────────────────────────────
function buildAnalysisPrompt(request: AIAnalysisRequest): string {
  const { market, orderBook, currentPosition, portfolioBalance, recentTrades, marketHistory } = request;

  const historyStr =
    marketHistory.length > 0
      ? `\nRecent price history (last ${marketHistory.length} data points):\n${marketHistory
          .map(
            (h) =>
              `  Time: ${new Date(h.timestamp).toISOString()} | YES: $${h.yes_price.toFixed(2)} | NO: $${h.no_price.toFixed(2)} | Vol: ${h.volume}`
          )
          .join("\n")}`
      : "\nNo price history available yet.";

  const orderBookStr = orderBook
    ? `\nOrder Book:
  YES side:
    Best Ask: $${orderBook.yes[0]?.price?.toFixed(2) || "N/A"} (${orderBook.yes[0]?.quantity || 0} contracts)
    Best Bid: $${orderBook.yes[1]?.price?.toFixed(2) || "N/A"} (${orderBook.yes[1]?.quantity || 0} contracts)
  NO side:
    Best Ask: $${orderBook.no[0]?.price?.toFixed(2) || "N/A"} (${orderBook.no[0]?.quantity || 0} contracts)
    Best Bid: $${orderBook.no[1]?.price?.toFixed(2) || "N/A"} (${orderBook.no[1]?.quantity || 0} contracts)`
    : "\nOrder book data unavailable.";

  const positionStr = currentPosition
    ? `\nCurrent Position in this market:
  Side: ${currentPosition.position > 0 ? "YES" : "NO"}
  Contracts: ${Math.abs(currentPosition.position)}
  Average Entry: $${(currentPosition.market_exposure / Math.max(Math.abs(currentPosition.position), 1)).toFixed(2)}
  Realized PnL: $${currentPosition.realized_pnl.toFixed(2)}`
    : "\nNo current position in this market.";

  const tradesStr =
    recentTrades.length > 0
      ? `\nRecent trades (last ${recentTrades.length}):\n${recentTrades
          .slice(0, 10)
          .map(
            (t) =>
              `  ${new Date(t.timestamp).toLocaleString()} | ${t.action.toUpperCase()} ${t.side.toUpperCase()} x${t.count} @ $${t.price.toFixed(2)} | PnL: $${t.pnl.toFixed(2)} | AI Confidence: ${(t.ai_confidence * 100).toFixed(0)}%`
          )
          .join("\n")}`
      : "\nNo recent trades.";

  return `ANALYZE THIS KALSHI MARKET AND PROVIDE A TRADING DECISION:

Market: ${market.title}
Ticker: ${market.ticker}
Category: ${market.category}
Status: ${market.status}
Current YES Price: $${(market.yes_ask / 100).toFixed(2)}
Current NO Price: $${(market.no_ask / 100).toFixed(2)}
Volume: ${market.volume}
Open Interest: ${market.open_interest}
Close Time: ${market.close_time}
Expiration: ${market.expiration_time}
${market.result ? `Result: ${market.result}` : ""}
${orderBookStr}
${positionStr}
Portfolio Balance: $${portfolioBalance.toFixed(2)}
${tradesStr}
${historyStr}

Provide your analysis and trading decision as a JSON object with these exact fields:
{
  "signal": "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO" | "HOLD" | "CLOSE",
  "confidence": <number 0-1>,
  "reasoning": "<detailed 2-3 sentence reasoning>",
  "suggested_size": <number of contracts>,
  "suggested_price": <price in cents, 0-100>,
  "risk_assessment": "LOW" | "MEDIUM" | "HIGH",
  "expected_value": <expected value in dollars>,
  "time_horizon": "<e.g. '2 hours', 'until expiry'>",
  "key_factors": ["<factor1>", "<factor2>", "<factor3>"]
}`;
}

// ─── Public Analysis Method ─────────────────────────────────────
export async function analyzeMarket(
  apiKey: string,
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  const prompt = buildAnalysisPrompt(request);
  const responseText = await callGemini(apiKey, prompt, SYSTEM_INSTRUCTION);

  try {
    const parsed = JSON.parse(responseText) as AIAnalysisResponse;
    // Validate required fields
    if (!parsed.signal || typeof parsed.confidence !== "number") {
      throw new Error("Invalid AI response structure");
    }
    // Clamp values
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    parsed.suggested_size = Math.max(0, Math.round(parsed.suggested_size));
    parsed.suggested_price = Math.max(0, Math.min(100, parsed.suggested_price));
    return parsed;
  } catch {
    throw new Error(`Failed to parse AI response: ${responseText.slice(0, 200)}`);
  }
}

// ─── Quick Market Scan ──────────────────────────────────────────
export async function scanMarkets(
  apiKey: string,
  markets: KalshiMarket[]
): Promise<
  Array<{ ticker: string; signal: string; confidence: number; reasoning: string }>
> {
  if (markets.length === 0) return [];

  const scanPrompt = `Scan these ${markets.length} Kalshi markets and identify the top 3 with the highest trading opportunity. For each, provide a brief assessment.

Markets:
${markets
  .map(
    (m) =>
      `- ${m.ticker}: ${m.title} | YES: $${(m.yes_ask / 100).toFixed(2)} | NO: $${(m.no_ask / 100).toFixed(2)} | Vol: ${m.volume} | OI: ${m.open_interest}`
  )
  .join("\n")}

Respond with a JSON array of objects:
[{"ticker": "<ticker>", "signal": "<BUY_YES|BUY_NO|HOLD>", "confidence": <0-1>, "reasoning": "<brief>"}]`;

  const responseText = await callGemini(apiKey, scanPrompt, SYSTEM_INSTRUCTION);
  try {
    return JSON.parse(responseText);
  } catch {
    return [];
  }
}
