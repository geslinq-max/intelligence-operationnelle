import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY non configurée');
  }
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    const stripe = getStripeClient();

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Erreur de validation webhook:', err);
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      );
    }

    // Traitement des événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('📦 Abonnement créé:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Abonnement mis à jour:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { forfaitId, forfaitName } = session.metadata || {};
  const customerEmail = session.customer_email;

  console.log('✅ Paiement réussi!');
  console.log(`   📧 Client: ${customerEmail}`);
  console.log(`   📦 Forfait: ${forfaitName} (${forfaitId})`);
  console.log(`   💰 Montant: ${(session.amount_total || 0) / 100} €`);

  // TODO: Implémenter la logique d'activation
  // 1. Mettre à jour le statut utilisateur à "Actif"
  // 2. Débloquer l'accès au Scanner Flash correspondant
  // 3. Envoyer notification interne de succès

  // Notification interne (simulation)
  console.log('🔔 Notification: Nouvel abonnement activé!');
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('❌ Abonnement annulé:', subscription.id);
  // TODO: Désactiver l'accès au Scanner Flash
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️ Échec de paiement pour:', invoice.customer_email);
  // TODO: Notifier l'utilisateur et admin
}
