import { Button, Box } from "@mui/material";
import usePushNotifications from "../hooks/usePushNotifications"
import { useState } from "react"
import { withRouter } from "react-router-dom"

function AskPushConsent(props) {
  const { userSubscription, pushNotificationSupported } = usePushNotifications()
  const gotAnswer = JSON.parse(localStorage.getItem("pushConsentDialogAnswer"))
  const [open, setOpen] = useState(pushNotificationSupported && !userSubscription && !gotAnswer)
  const onConsent = () => {
    setOpen(false)
    localStorage.setItem("pushConsentDialogAnswer", JSON.stringify(true))
    props.history.push("/settings#notificationsSettings")
  }
  const closeDialog = () => {
    setOpen(false)
    localStorage.setItem("pushConsentDialogAnswer", JSON.stringify(true))
  }
  const styles = {
    position: 'absolute',
    top: '80%',
    left: 'calc(100% - 200px)',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    bgcolor: '#fff',
    boxShadow: 24,
    p: 3,
    zIndex: 10
  }
  return open && (
    <Box sx={styles}>
      <h3 style={{margin: '5px 0px'}}>Povolit notifikace?</h3>
      <p style={{fontSize: 14, margin: '5px 0px'}}>Pokud jsi je zapnete, budou vám přicházet oznámení ihned po zveřejnění úkolu nebo komentáře</p>
      <div style={{display: "flex"}}>
        <Button onClick={onConsent}>Do nastavení</Button>
        <div style={{flexGrow:1}}/>
        <Button onClick={closeDialog}>Ne, děkuji</Button>
      </div>
    </Box>
  )
}

export default withRouter(AskPushConsent)
