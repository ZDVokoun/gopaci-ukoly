import { useAuth } from "../providers/auth-provider";
import { useState } from "react";
import { Redirect } from "react-router-dom";
import { Button, Card, TextField } from "@mui/material";

export function Login() {
    const { user, login, redirectLink } = useAuth();
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");
    const handleSubmit = () => {
        login({username, password});
    }
    return user ? <Redirect to={redirectLink} /> : (
        <Card
            id="login"
            variant="outlined"
        >
            <h2>Přihlašte se</h2>
            <TextField
                required
                fullWidth
                id="username"
                label="Jméno"
                variant="standard"
                onChange={event => setUsername(event.target.value)}
            />
            <TextField
                required
                fullWidth
                id="standard-password-input"
                label="Heslo"
                type="password"
                autoComplete="current-password"
                variant="standard"
                onChange={event => setPassword(event.target.value)}
            />
            <Button fullWidth onClick={handleSubmit}>Přihlásit se</Button>
        </Card>
    )
}