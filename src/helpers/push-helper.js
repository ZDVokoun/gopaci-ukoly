import webpush from "web-push";

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};

export async function sendNotifications(title, text, url, subscriptions) {
  const notification = JSON.stringify({
    title,
    body: text,
    url: url
  });
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails
  }
  await subscriptions.forEach(async subscription => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substring(endpoint.length - 8);
    await webpush.sendNotification(subscription, notification, options)
      .catch(error => console.error(`Error occured when sending notification to ${id}: ${error}`))
  })
}
