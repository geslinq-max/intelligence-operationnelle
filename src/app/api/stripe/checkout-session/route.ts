import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG, ForfaitId } from '@/lib/stripe/config';

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY non configurée');
  }
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forfaitId, customerEmail } = body as { forfaitId: ForfaitId; customerEmail?: string };

    // Validation du forfait
    const forfait = STRIPE_CONFIG.forfaits[forfaitId];
    if (!forfait) {
      return NextResponse.json(
        { error: 'Forfait invalide' },
        { status: 400 }
      );
    }

    // Création de la session Stripe Checkout (Mode Hybride CB + SEPA)
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: forfait.name,
              description: forfait.description,
            },
            unit_amount: forfait.amount,
            recurring: {
              interval: forfait.interval,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        forfaitId,
        forfaitName: forfait.name,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}${STRIPE_CONFIG.urls.success}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${STRIPE_CONFIG.urls.cancel}`,
      locale: 'fr',
      billing_address_collection: 'required',
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erreur Stripe Checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
