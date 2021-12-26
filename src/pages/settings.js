import { useState } from "react";
import { useAuth } from "../providers/auth-provider.js";
import { Alert, CircularProgress, Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, TextField, Button } from "@mui/material"
import usePushNotifications from "../hooks/usePushNotifications"

function ConfirmationDialog({ title, content, open, onConfirm, onClose }) {
    return (
        <Dialog
          open={open}
          onClose={onClose}
        >
            <DialogTitle>{ title }</DialogTitle>
            <DialogContent>
                <DialogContentText>
                  { content }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autofocus>Zpět</Button>
                <Button onClick={onConfirm}>Souhlasím</Button>
            </DialogActions>
        </Dialog>
    )
}

function NewPasswordForm() {
    const { changePassword } = useAuth();
    const [open, setOpen] = useState(false);
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const handleSubmit = () => {
        setOpen(false)
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
                value={oldPass}
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
                value={newPass}
                onChange={event => setNewPass(event.target.value)}
            />
            <Button fullWidth onClick={ () => setOpen(true) }>Změnit heslo</Button>
            <ConfirmationDialog
                title="Opravdu chcete změnit heslo?"
                content="Po změně hesla nebudete moct používat heslo původní."
                open={open}
                onClose={() => {
                    setOpen(false);
                    setNewPass("");
                    setOldPass("");
                }}
                onConfirm={ handleSubmit }
            />
        </div>)
}
function NotificationPage(props) {
    const {
        pushNotificationSupported,
        userSubscription,
        onClickTurnOnNotification,
        onClickUnsubscribe,
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
