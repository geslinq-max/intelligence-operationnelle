import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendActivationEmail } from '@/lib/email/send-activation-email';

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
  const customerName = session.customer_details?.name || null;
  const amountTotal = session.amount_total || 0;
  const paymentStatus = session.payment_status;

  console.log('✅ Paiement réussi!');
  console.log(`   📧 Client: ${customerEmail}`);
  console.log(`   👤 Nom: ${customerName}`);
  console.log(`   📦 Forfait: ${forfaitName} (${forfaitId})`);
  console.log(`   💰 Montant: ${amountTotal / 100} €`);
  console.log(`   📋 Statut: ${paymentStatus}`);

  // Vérifier que le paiement est validé (statut "paid")
  if (paymentStatus !== 'paid') {
    console.log('⏳ Paiement en attente de validation, email différé');
    return;
  }

  // Vérifier les données requises
  if (!customerEmail || !forfaitId) {
    console.error('❌ Données manquantes pour l\'email d\'activation');
    return;
  }

  // 1. Envoyer l'email d'activation (Scanner Flash prêt)
  const emailResult = await sendActivationEmail(
    customerEmail,
    customerName,
    forfaitId,
    amountTotal
  );

  if (emailResult.success) {
    console.log(`📧 Email d'activation envoyé (${emailResult.mode}): ${emailResult.emailId}`);
  } else {
    console.error('❌ Échec envoi email d\'activation:', emailResult.message);
  }

  // 2. Notification interne de succès
  console.log('🔔 Notification: Nouvel abonnement activé!');
  console.log(`   → Scanner Flash débloqué pour ${customerEmail}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('❌ Abonnement annulé:', subscription.id);
  // TODO: Désactiver l'accès au Scanner Flash
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️ Échec de paiement pour:', invoice.customer_email);
  // TODO: Notifier l'utilisateur et admin
}
