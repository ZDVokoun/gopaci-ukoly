/*
 * Some code is made by Lorenzo Spinelli (@Spyna) under MIT license
 */

import { useState, useEffect } from "react";
import { sendRequest } from "../helpers/http-helper"

const pushServerPublicKey = "***REMOVED***"

/**
 * checks if Push notification and service workers are supported by your browser
 */
function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * asks user consent to receive push notifications and returns the response of the user, one of granted, default, denied
 */
async function askUserPermission() {
  return await Notification.requestPermission();
}
/**
 * shows a notification
 */
/*
function sendNotification(title, text) {
  const options = {
    body: text,
    icon: "/images/jason-leung-HM6TMmevbZQ-unsplash.jpg",
    vibrate: [200, 100, 200],
    tag: "homework",
    badge: "https://spyna.it/icons/android-icon-192x192.png",
    actions: [{ action: "Detail", title: "View", icon: "https://via.placeholder.com/128/ff0000" }]
  };
  navigator.serviceWorker.ready.then(function(serviceWorker) {
    serviceWorker.showNotification(title, options);
  });
}
*/
/**
 *
 */
function registerServiceWorker() {
  return navigator.serviceWorker.register("/sw.js");
}

/**
 *
 * using the registered service worker creates a push notification subscription and returns it
 *
 */
async function createNotificationSubscription() {
  //wait for service worker installation to be ready
  const serviceWorker = await navigator.serviceWorker.ready;
  // subscribe and return the subscription
  return await serviceWorker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: pushServerPublicKey
  });
}

/**
 * returns the subscription if present or nothing
 */
function getUserSubscription() {
  //wait for service worker installation to be ready, and then
  return navigator.serviceWorker.ready
    .then(function(serviceWorker) {
      return serviceWorker.pushManager.getSubscription();
    })
    .then(function(pushSubscription) {
      return pushSubscription;
    });
}


const pushNotificationSupported = isPushNotificationSupported();
//first thing to do: check if the push notifications are supported by the browser

export default function usePushNotifications() {
  const [userConsent, setSuserConsent] = useState(Notification.permission);
  //to manage the user consent: Notification.permission is a JavaScript native function that return the current state of the permission
  //We initialize the userConsent with that value
  const [userSubscription, setUserSubscription] = useState(null);
  //to manage the use push notification subscription
  const [pushServerSubscriptionId, setPushServerSubscriptionId] = useState();
  //to manage the push server subscription
  const [error, setError] = useState(null);
  //to manage errors
  const [loading, setLoading] = useState(true);
  //to manage async actions

  useEffect(() => {
    if (pushNotificationSupported) {
      setLoading(true);
      setError(false);
      registerServiceWorker().then(() => {
        setLoading(false);
      });
    }
  }, []);
  //if the push notifications are supported, registers the service worker
  //this effect runs only the first render

  useEffect(() => {
    setLoading(true);
    setError(false);
    const getExixtingSubscription = async () => {
      const existingSubscription = await getUserSubscription();
      setUserSubscription(existingSubscription);
      setLoading(false);
    };
    getExixtingSubscription();
  }, []);
  //Retrieve if there is any push notification subscription for the registered service worker
  // this use effect runs only in the first render

  /**
   * define a click handler that asks the user permission,
   * it uses the setSuserConsent state, to set the consent of the user
   * If the user denies the consent, an error is created with the setError hook
   */
  const onClickTurnOnNotification = () => {
    setLoading(true);
    setError(false);
    return askUserPermission().then(consent => {
      setSuserConsent(consent);

      if (consent !== "granted") {
        setError({
          name: "Consent denied",
          message: "You denied the consent to receive notifications",
          code: 0
        });
        setLoading(false)
        return
      }
      createNotificationSubscription()
        .then(function(subscription) {
            setUserSubscription(subscription);
            sendRequest("pushsubscribe", {subscription: subscription})
            .then(function(response) {
                setPushServerSubscriptionId(response.id);
                setLoading(false);
            })
            .catch(err => {
                setLoading(false);
                setError(err);
            });
        })
        .catch(err => {
            console.error("Couldn't create the notification subscription", err, "name:", err.name, "message:", err.message, "code:", err.code);
            setError(err);
            setLoading(false);
        });
    }).catch(err => {
      setError(err)
      setLoading(false)
    })
  }



  const onClickUnsubscribe = () => {
    setLoading(true)
    return sendRequest("pushunsubscribe", {subscription: userSubscription})
      .then(() => userSubscription.unsubscribe()
        .then(() => {
            console.info('Successfully unsubscribed from push notifications.');
            setUserSubscription(null)
            setLoading(false)
        })
        .catch(e => alert(e))
      ).catch(e => alert(e))
  }

  /**
   * returns all the stuff needed by a Component
   */
  return {
    onClickUnsubscribe,
    onClickTurnOnNotification,
    pushServerSubscriptionId,
    userConsent,
    pushNotificationSupported,
    userSubscription,
    error,
    loading
  };
}
