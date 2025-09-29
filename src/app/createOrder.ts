"use server";

import { importJWK, type JWTPayload, SignJWT } from "jose";
import { z } from "zod";

const host = "api.cdp.coinbase.com";

export async function createOrder(
  _prevState: {
    success: boolean;
    url?: string | undefined;
  },
  formData: FormData,
): Promise<{
  success: boolean;
  url?: string | undefined;
}> {
  const json = z.parse(
    z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      amount: z.coerce.number().gte(1).lt(10_000),
      domain: z.string(),
      email: z.email(),
      phone: z.string(),
    }),
    {
      address: formData.get("address"),
      amount: formData.get("amount"),
      domain: formData.get("domain"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    },
  );

  const env = z.parse(
    z.object({
      CB_API_KEY_ID: z.string(),
      CB_API_KEY_SECRET: z.string(),
    }),
    process.env,
  );

  const path = "/platform/v2/onramp/orders";
  const method = "POST";
  const jwt = await generateCoinbaseJwt({
    keyId: env.CB_API_KEY_ID,
    keySecret: env.CB_API_KEY_SECRET,
    request: { method, path },
  });

  const response = await fetch(`https://${host}${path}`, {
    body: JSON.stringify({
      agreementAcceptedAt: new Date().toISOString(),
      destinationAddress: json.address,
      destinationNetwork: "base",
      domain: json.domain,
      email: json.email,
      partnerUserRef: `sandbox-${json.address}`,
      paymentCurrency: "USD",
      paymentMethod: "GUEST_CHECKOUT_APPLE_PAY",
      phoneNumber: json.phone,
      phoneNumberVerifiedAt: new Date().toISOString(),
      purchaseAmount: json.amount.toString(),
      purchaseCurrency: "USDC",
    }),
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    method,
  });

  console.log(response);

  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

  const data = await response.json();
  const parsed = await z
    .object({
      order: z.object({
        orderId: z.string(),
      }),
      paymentLink: z.object({
        paymentLinkType: z.literal("PAYMENT_LINK_TYPE_APPLE_PAY_BUTTON"),
        url: z.url(),
      }),
    })
    .parseAsync(data);

  return {
    success: true,
    url: parsed.paymentLink.url,
  };
}

async function generateCoinbaseJwt(opts: {
  claims?: JWTPayload | undefined;
  expiresIn?: number | undefined;
  keyId: string;
  keySecret: string;
  nonce?: string | undefined;
  now?: number | undefined;
  request: {
    method: "GET" | "POST";
    host?: string | undefined;
    path: string;
  };
}) {
  const {
    claims = {
      aud: ["cdp_service"],
      iss: "cdp",
      sub: opts.keyId,
      uris: [
        `${opts.request.method} ${opts.request.host ?? host}${opts.request.path}`,
      ],
    },
    expiresIn = 120,
    nonce = crypto.randomUUID(),
    now = Math.floor(Date.now() / 1000),
  } = opts;
  const decoded = Buffer.from(opts.keySecret, "base64");
  if (decoded.length !== 64) throw new Error("Invalid Ed25519 key length");

  const alg = "EdDSA";
  const seed = decoded.subarray(0, 32);
  const publicKey = decoded.subarray(32);
  const key = await importJWK(
    {
      crv: "Ed25519",
      d: seed.toString("base64url"),
      kty: "OKP",
      x: publicKey.toString("base64url"),
    },
    alg,
  );

  return await new SignJWT(claims)
    .setProtectedHeader({
      alg,
      kid: opts.keyId,
      nonce,
      typ: "JWT",
    })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + expiresIn)
    .sign(key);
}
