/*
 * Some code is made by Lorenzo Spinelli (@Spyna) under MIT license
 */

import { useState, useEffect } from "react";
import http from "../helpers/http-helper";

const pushServerPublicKey =
  "BFzA76nvaPbtxKfAtgI9Ankc1l-IuKeyciRfFMWalSwDNyP1SfzrRwB2EinHBkjgpxQG9Vp_N5TJ1S4n_b-VdoE";

/**
 * checks if Push notification and service workers are supported by your browser
 */
function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

function registerServiceWorker() {
  return navigator.serviceWorker.register("/sw.js");
}

/**
 * returns the subscription if present or nothing
 */
function getUserSubscription() {
  //wait for service worker installation to be ready, and then
  return navigator.serviceWorker.ready
    .then(function (serviceWorker) {
      return serviceWorker.pushManager.getSubscription();
    })
    .then(function (pushSubscription) {
      return pushSubscription;
    });
}

//first thing to do: check if the push notifications are supported by the browser
const pushNotificationSupported = isPushNotificationSupported();

export default function usePushNotifications() {
  const [userConsent, setUserConsent] = useState(Notification.permission);
  //to manage the user consent: Notification.permission is a JavaScript native function that return the current state of the permission
  //We initialize the userConsent with that value
  const [userSubscription, setUserSubscription] = useState(null);
  //to manage the use push notification subscription
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
   * it uses the setUserConsent state, to set the consent of the user
   * If the user denies the consent, an error is created with the setError hook
   */
  const onClickTurnOnNotification = () => {
    setLoading(true);
    setError(false);
    return Notification.requestPermission()
      .then((consent) => {
        setUserConsent(consent);
        if (consent !== "granted") {
          setError({
            name: "Consent denied",
            message: "You denied the consent to receive notifications",
            code: 0,
          });
          setLoading(false);
          return;
        }
        return navigator.serviceWorker.ready.then((serviceWorker) => {
          return serviceWorker.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey: pushServerPublicKey,
            })
            .then(function (subscription) {
              setUserSubscription(subscription);
              return http
                .post("/api/settings/push", { subscription: subscription })
                .then(() => setLoading(false));
            });
        });
      })
      .catch((err) => {
        console.error(
          "Couldn't create the notification subscription",
          err,
          "name:",
          err.name,
          "message:",
          err.message,
          "code:",
          err.code
        );
        setError(err);
        setLoading(false);
        return;
      });
  };

  const onClickUnsubscribe = () => {
    setLoading(true);
    return http
      .delete("/api/settings/push", { subscription: userSubscription })
      .then(() =>
        userSubscription.unsubscribe().then(() => {
          console.info("Successfully unsubscribed from push notifications.");
          setUserSubscription(null);
          setLoading(false);
        })
      )
      .catch((e) => {
        setError(e);
        setLoading(false);
      });
  };

  /**
   * returns all the stuff needed by a Component
   */
  return {
    onClickUnsubscribe,
    onClickTurnOnNotification,
    userConsent,
    pushNotificationSupported,
    userSubscription,
    error,
    loading,
  };
}
