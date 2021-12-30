import webpush from "web-push";

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};

export function sendNotifications(title, text, url, subscriptions) {
  const notification = JSON.stringify({
    title,
    body: text,
    url: url
  });
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails
  }
  const newPromise = (subscription) => new Promise((resolve, reject) => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substring(endpoint.length - 8);
    return webpush.sendNotification(subscription, notification, options)
      .then(() => resolve())
      .catch(error => reject(`Error occured when sending notification to ${id}: ${error}`))
  })
  return Promise.all(subscriptions.map(item => newPromise(item).catch(err => err)))
    .then(errs => errs.forEach(err => err && console.error(err)))
}
