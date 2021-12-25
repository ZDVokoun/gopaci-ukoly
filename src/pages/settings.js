import { useState } from "react";
import { useAuth } from "../providers/auth-provider.js";
import { Alert, CircularProgress, TextField, Button } from "@mui/material"
import usePushNotifications from "../hooks/usePushNotifications"

function NewPasswordForm() {
    const { changePassword } = useAuth();
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const handleSubmit = () => {
        changePassword(oldPass, newPass).catch(error => alert(error));
    }

    return (
        <div id="newPassword">
            <h2>Změna hesla</h2>
            <TextField
                required
                fullWidth
                id="old-password"
                label="Staré heslo"
                type="password"
                autoComplete="current-password"
                variant="standard"
                onChange={event => setOldPass(event.target.value)}
            />
            <TextField
                required
                fullWidth
                id="new-password"
                label="Nové heslo"
                type="password"
                autoComplete="new-password"
                variant="standard"
                onChange={event => setNewPass(event.target.value)}
            />
            <Button fullWidth onClick={handleSubmit}>Změnit heslo</Button>
        </div>)
}
function NotificationPage(props) {
    const {
        userConsent,
        pushNotificationSupported,
        userSubscription,
        onClickTurnOnNotification,
        onClickUnsubscribe,
        pushServerSubscriptionId,
        error,
        loading
    } = usePushNotifications();
    return (
        <div>
          <h2>Notifikace</h2>
          { error && <Alert severity="error">{error.message}</Alert> }
          { !pushNotificationSupported && <p>Váš prohlížeč nebo systém nepodporuje notifikace. Pokud jste na operačním systému MacOS, použíjte prohlížeč Firefox nebo Chrome. Na operačním systému iOS bohužel není možnost notifikace zprovoznit.</p> }
          {loading && <p><CircularProgress size="14px"/>Načítání</p>}
          <Button disabled={ !pushNotificationSupported || userSubscription } onClick={onClickTurnOnNotification}>Zapnout notifikace</Button>
          <Button disabled={ !pushNotificationSupported || !userSubscription } onClick={onClickUnsubscribe}>Vypnout notifikace</Button>
        </div>
    )
}

export function Settings(props) {
    return (<div>
        <h1>Nastavení</h1>
        <NewPasswordForm/>
        <NotificationPage/>
        </div>)
}
