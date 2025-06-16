import { subscribePushNotification, unsubscribePushNotification } from '../data/api.js';
import { VAPID_KEY } from '../config.js';

function urlBase64ToUint8Array(base64String) {
  // Add the missing padding replacement
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Modify the handleSubscribe function with improved VAPID key handling

export async function handleSubscribe() {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported by your browser.');
      return false;
    }

    // Check and debug the VAPID key
    const applicationServerKey = urlBase64ToUint8Array(VAPID_KEY);
    console.log('Raw VAPID key:', VAPID_KEY);
    console.log('Key length after conversion:', applicationServerKey.length);

    // Length should be 65 bytes for VAPID keys
    if (applicationServerKey.length !== 65) {
      console.error('VAPID key has incorrect length! Should be 65 bytes.');
      alert('Invalid server configuration. Please contact support.');
      return false;
    }

    // Request permission if needed
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission denied.');
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    console.log('Service Worker is ready:', registration);

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log('Using existing subscription:', subscription);
      const subscriptionJson = subscription.toJSON();
      await subscribePushNotification(subscriptionJson);
      return true;
    }

    // Create new subscription with detailed error handling
    try {
      console.log('Creating new push subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
      console.log('Subscription created successfully:', subscription);

      const subscriptionJson = subscription.toJSON();
      console.log('Sending subscription to server:', subscriptionJson);
      await subscribePushNotification(subscriptionJson);
      return true;
    } catch (subscribeError) {
      if (subscribeError.name === 'NotAllowedError') {
        throw new Error('Permission denied for notifications.');
      } else if (subscribeError.message.includes('push service')) {
        throw new Error('Push service connection failed. Server might be misconfigured.');
      } else {
        throw subscribeError;
      }
    }
  } catch (error) {
    return false;
  }
}

export async function handleUnsubscribe() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribePushNotification({ endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
  } catch (error) {
    console.error('Gagal melakukan unsubscribe:', error);
  }
}

export async function debugServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported in this browser');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('SW registrations found:', registrations.length);

    registrations.forEach((reg, i) => {
      console.log(`SW #${i + 1}:`, {
        scope: reg.scope,
        active: reg.active ? 'Yes' : 'No',
        installing: reg.installing ? 'Yes' : 'No',
        waiting: reg.waiting ? 'Yes' : 'No',
        updateViaCache: reg.updateViaCache,
      });
    });

    return registrations.length > 0;
  } catch (err) {
    console.error('Error checking SW registrations:', err);
    return false;
  }
}
