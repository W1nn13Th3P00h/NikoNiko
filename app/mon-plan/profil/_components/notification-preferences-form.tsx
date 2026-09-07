"use client";

import { useEffect, useState, useTransition } from "react";
import {
  updateNotificationPreferences,
  saveOwnPushSubscription,
  deleteOwnPushSubscription,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// VAPID public keys are base64url; PushManager.subscribe wants a raw Uint8Array.
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type DeviceStatus = "checking" | "unsupported" | "subscribed" | "unsubscribed";

async function detectDeviceStatus(): Promise<DeviceStatus> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "subscribed" : "unsubscribed";
}

export function NotificationPreferencesForm({
  initial,
}: {
  initial: { notifVeilleSeance: boolean; notifJourMemeSeance: boolean };
}) {
  const [notifVeille, setNotifVeille] = useState(initial.notifVeilleSeance);
  const [notifJourMeme, setNotifJourMeme] = useState(initial.notifJourMemeSeance);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("checking");
  const [isDevicePending, startDeviceTransition] = useTransition();

  useEffect(() => {
    detectDeviceStatus().then(setDeviceStatus);
  }, []);

  function handleSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        notifVeilleSeance: notifVeille,
        notifJourMemeSeance: notifJourMeme,
      });
      setMessage(
        result.error
          ? { type: "error", text: result.error }
          : { type: "success", text: "Préférences enregistrées." }
      );
    });
  }

  function handleEnableDevice() {
    startDeviceTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) throw new Error("Notifications non configurées.");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Permission refusée.");

        await navigator.serviceWorker.register("/sw.js");
        // register() can resolve before the worker is active; subscribe()
        // requires an active one, so wait for .ready rather than using the
        // registration register() returned.
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const result = await saveOwnPushSubscription(
          subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
        );
        if (result.error) throw new Error(result.error);

        setDeviceStatus("subscribed");
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Échec de l'activation.",
        });
      }
    });
  }

  function handleDisableDevice() {
    startDeviceTransition(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deleteOwnPushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setDeviceStatus("unsubscribed");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="notif-veille"
              checked={notifVeille}
              onCheckedChange={(c) => setNotifVeille(c === true)}
            />
            <Label htmlFor="notif-veille">Rappel la veille au soir</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="notif-jour-meme"
              checked={notifJourMeme}
              onCheckedChange={(c) => setNotifJourMeme(c === true)}
            />
            <Label htmlFor="notif-jour-meme">Rappel le matin même</Label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending} className="self-start">
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {message && (
            <p className={message.type === "error" ? "text-destructive text-sm" : "text-sm"}>
              {message.text}
            </p>
          )}
        </div>

        <div className="border-t pt-3">
          {deviceStatus === "checking" && (
            <p className="text-muted-foreground text-sm">Vérification de cet appareil…</p>
          )}
          {deviceStatus === "unsupported" && (
            <p className="text-muted-foreground text-sm">
              Les notifications ne sont pas disponibles sur cet appareil ou ce navigateur. Sur
              iPhone, ajoute d&apos;abord l&apos;app à l&apos;écran d&apos;accueil depuis Safari.
            </p>
          )}
          {deviceStatus === "unsubscribed" && (
            <Button variant="outline" size="sm" onClick={handleEnableDevice} disabled={isDevicePending}>
              {isDevicePending ? "Activation…" : "Activer les notifications sur cet appareil"}
            </Button>
          )}
          {deviceStatus === "subscribed" && (
            <div className="flex items-center gap-3">
              <p className="text-sm">Notifications activées sur cet appareil.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisableDevice}
                disabled={isDevicePending}
              >
                {isDevicePending ? "Désactivation…" : "Désactiver sur cet appareil"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
