import { useState } from "react";
import { useAuth } from "../providers/auth-provider.js";
import { TextField, Button } from "@mui/material"

function NewPasswordForm() {
    const { changePassword } = useAuth();
    const [oldPass, setOldPass] = useState("");   
    const [newPass, setNewPass] = useState("");
    const handleSubmit = () => {
        changePassword(oldPass, newPass).catch(error => alert(error));
    }

    return (<div id="newPassword">
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

export function Settings(props) {
    return (<div>
        <h1>Nastavení</h1>
        <NewPasswordForm/>
        </div>)
}