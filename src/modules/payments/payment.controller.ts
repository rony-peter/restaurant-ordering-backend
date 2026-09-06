import { Request, Response } from "express";
import Stripe from "stripe";
import { createPaymentIntent, handlePaymentSuccess } from "./payment.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function createPaymentIntentHandler(req: Request, res: Response) {
  try {
    const { orderId, restaurantId } = req.body;

    if (!orderId || !restaurantId) {
      return res.status(400).json({ message: "orderId and restaurantId are required" });
    }

    const result = await createPaymentIntent(orderId, restaurantId);
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handlePaymentSuccess(paymentIntent.id);
  }

  return res.status(200).json({ received: true });
}