import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth-provider.js";
import { Alert, Checkbox, CircularProgress, Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, FormGroup, FormControlLabel, TextField, Button } from "@mui/material"
import usePushNotifications from "../hooks/usePushNotifications"
import { LoadingWithBackdrop } from "../components/loading"
import { sendRequest } from "../helpers/http-helper"

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
function NotificationPage({ settings, sendChange }) {
    const {
        userConsent,
        pushNotificationSupported,
        userSubscription,
        onClickTurnOnNotification,
        onClickUnsubscribe,
        error,
        loading
    } = usePushNotifications();
    const [notifyAboutChecked, setNotifyAboutChecked] = useState({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => userConsent !== "granted" && userSubscription && onClickUnsubscribe(), [userConsent])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => settings.notifyAbout && !notifyAboutChecked.homeworks && setNotifyAboutChecked({homeworks: settings.notifyAbout.includes("homeworks"), comments: settings.notifyAbout.includes("comments")}), [settings])
    const onChange = (event) => {
        let changed = settings.notifyAbout;
        event.target.checked ? changed.push(event.target.name) : changed.splice(changed.indexOf(event.target.name), 1)
        setNotifyAboutChecked({...notifyAboutChecked, [event.target.name]: event.target.checked})
        return sendChange({...settings, notifyAbout : changed});
    }
    return (
        <div id="notificationsSettings">
          <h2>Notifikace</h2>
          { error && <Alert severity="error">{JSON.stringify(error)}</Alert> }
          { !pushNotificationSupported && <p>Váš prohlížeč nebo systém nepodporuje notifikace. Pokud jste na operačním systému MacOS, použíjte prohlížeč Firefox nebo Chrome. Na operačním systému iOS bohužel není možnost notifikace zprovoznit.</p> }
          {loading && <p><CircularProgress size="14px"/>Načítání</p>}
          <Button disabled={ !pushNotificationSupported || userSubscription } onClick={onClickTurnOnNotification}>Zapnout notifikace</Button>
          <Button disabled={ !pushNotificationSupported || !userSubscription } onClick={onClickUnsubscribe}>Vypnout notifikace</Button>
          <FormGroup>
            <h3>Dostávat oznámení o:</h3>
            <FormControlLabel control={<Checkbox disabled={!pushNotificationSupported || !userSubscription} onChange={onChange} checked={notifyAboutChecked.homeworks === true} name="homeworks"/>} label="Domácích úkolech"/>
            <FormControlLabel control={<Checkbox disabled={!pushNotificationSupported || !userSubscription} checked={notifyAboutChecked.comments === true} onChange={onChange} name="comments"/>} label="Komentářích"/>
          </FormGroup>
        </div>
    )
}

export function Settings(props) {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});
    useEffect(() => sendRequest("settings").then(res => {
        setSettings(res)
        setLoading(false)
    }).catch((err) => {
        alert(err)
        setLoading(false);
    }), [])
    const onSubmit = () => {
        setLoading(true)
        return sendRequest("settings", {settings}).then(() => {
            sendRequest("settings").then(res => {
                setSettings(res)
                setLoading(false)
            }).catch(err => alert(err))
        }).catch(err => alert(err))
    }
    const getChange = (object) => setSettings(object);
    return (<div style={{margin: '0px 50px'}}>
        { loading && <LoadingWithBackdrop/> }
        <h1>Nastavení</h1>
        <NewPasswordForm/>
        <NotificationPage settings={settings} sendChange={getChange} />
        <br/>
        <Button onClick={onSubmit}>Uložit</Button>
        </div>)
}
