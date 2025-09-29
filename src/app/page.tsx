"use client";

import { useActionState } from "react";
import { createOrder } from "./createOrder";

export default function Page() {
  const [state, formAction] = useActionState(createOrder, {
    success: false,
    url: undefined,
  });

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
            <label htmlFor="amount">Amount (USD):</label>
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
            <label htmlFor="domain">Domain:</label>
            <input
              type="text"
              placeholder="example.com"
              id="domain"
              name="domain"
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

          <button type="submit">Create Order</button>
        </form>
      )}

      {state.success && state.url && (
        <div>
          <iframe
            src={state.url}
            width="100%"
            height="600"
            title="Coinbase Payment"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
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
