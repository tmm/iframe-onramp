"use client";

import React, { useActionState, useEffect } from "react";
import { z } from "zod";
import { createOrder } from "./createOrder";

export default function Page() {
  const [state, formAction] = useActionState(createOrder, {
    success: false,
    url: undefined,
  });

  const [onrampState, setOnrampState] = React.useState<
    CbPostMessageSchema | undefined
  >();
  useEffect(() => {
    function handlePostMessage(event: MessageEvent) {
      if (event.origin !== "https://pay.coinbase.com") return;
      const data = z.parse(cbPostMessageSchema, JSON.parse(event.data));
      console.log("postMessage", data);
      setOnrampState(data);
    }
    window.addEventListener("message", handlePostMessage);
    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, []);

  return (
    <div>
      <h1>iframe onramp</h1>

      {!state.success && (
        <form action={formAction}>
          <div>
            <label htmlFor="address">Wallet Address:</label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="0x..."
              pattern="^0x[a-fA-F0-9]{40}$"
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              placeholder="name@example.com"
              id="email"
              name="email"
              required
            />
          </div>

          <div>
            <label htmlFor="phone">Phone Number:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="123-456-7890"
              required
            />
          </div>

          <div>
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              min="1"
              max="9999"
              required
              defaultValue="10"
              placeholder="10"
            />
          </div>

          <div>
            <label htmlFor="domain">Domain:</label>
            <input
              type="text"
              placeholder="example.com"
              id="domain"
              name="domain"
              defaultValue={
                typeof location !== "undefined" ? location.host : ""
              }
              required
            />
          </div>

          <button type="submit">Create Order</button>
        </form>
      )}

      {onrampState && <div>{JSON.stringify(onrampState, null, 2)}</div>}

      {state.success && state.url && (
        <div>
          <iframe
            height="675"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            src={state.url}
            title="Onramp"
            width="100%"
          />
          <div>
            <button type="button" onClick={() => window.location.reload()}>
              Create New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cbPostMessageSchema = z.union([
  z.object({
    eventName: z.union([
      z.literal("onramp_api.apple_pay_button_pressed"),
      z.literal("onramp_api.cancel"),
      z.literal("onramp_api.commit_success"),
      z.literal("onramp_api.load_pending"),
      z.literal("onramp_api.load_success"),
      z.literal("onramp_api.polling_start"),
      z.literal("onramp_api.polling_success"),
    ]),
  }),
  z.object({
    data: z.object({
      errorCode: z.union([
        z.literal("ERROR_CODE_GUEST_APPLE_PAY_NOT_SETUP"),
        z.literal("ERROR_CODE_GUEST_APPLE_PAY_NOT_SUPPORTED"),
        z.literal("ERROR_CODE_INIT"),
      ]),
      errorMessage: z.string(),
    }),
    eventName: z.literal("onramp_api.load_error"),
  }),
  z.object({
    data: z.object({
      errorCode: z.union([
        z.literal("ERROR_CODE_GUEST_CARD_HARD_DECLINED"),
        z.literal("ERROR_CODE_GUEST_CARD_INSUFFICIENT_BALANCE"),
        z.literal("ERROR_CODE_GUEST_CARD_PREPAID_DECLINED"),
        z.literal("ERROR_CODE_GUEST_CARD_RISK_DECLINED"),
        z.literal("ERROR_CODE_GUEST_CARD_SOFT_DECLINED"),
        z.literal("ERROR_CODE_GUEST_INVALID_CARD"),
        z.literal("ERROR_CODE_GUEST_PERMISSION_DENIED"),
        z.literal("ERROR_CODE_GUEST_REGION_MISMATCH"),
        z.literal("ERROR_CODE_GUEST_TRANSACTION_COUNT"),
        z.literal("ERROR_CODE_GUEST_TRANSACTION_LIMIT"),
      ]),
      errorMessage: z.string(),
    }),
    eventName: z.literal("onramp_api.commit_error"),
  }),
  z.object({
    data: z.object({
      errorCode: z.union([
        z.literal("ERROR_CODE_GUEST_TRANSACTION_BUY_FAILED"),
        z.literal("ERROR_CODE_GUEST_TRANSACTION_SEND_FAILED"),
        z.literal("ERROR_CODE_GUEST_TRANSACTION_TRANSACTION_FAILED"),
        z.literal("ERROR_CODE_GUEST_TRANSACTION_AVS_VALIDATION_FAILED"),
      ]),
      errorMessage: z.string(),
    }),
    eventName: z.literal("onramp_api.polling_error"),
  }),
]);
type CbPostMessageSchema = z.infer<typeof cbPostMessageSchema>;
