import { useAuth } from "../providers/auth-provider";
import { useState } from "react";
import { Redirect } from "react-router-dom";
import { Button, Card, TextField } from "@mui/material";

export function Login(props) {
    const { user, login } = useAuth();
    const prevPath = props.location.state && props.location.state.prevPath;
    const redirectTo = prevPath || "/";
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");
    const handleSubmit = event => {
        event.preventDefault();
        return login({username, password}).catch(error => alert(error))
    };

    return user ? <Redirect to={redirectTo} /> : (
        <Card
            id="login"
            variant="outlined"
        > 
            <form onSubmit={handleSubmit}>
                <h2>Přihlašte se</h2>
                <TextField
                    required
                    fullWidth
                    id="username"
                    label="Jméno"
                    variant="standard"
                    autoComplete="username"
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
                <Button fullWidth type="submit">Přihlásit se</Button>
            </form>
        </Card>
    )
}