import { Button } from "@mui/material";
import { useMemo } from "react";
import { sendRequest, debounce } from "../helpers/http-helper";
import { Done, Replay } from '@mui/icons-material';

export default function DoneButton({ postID, type = "homework", isDone = false, onSubmit = () => {} }) {
    const handleSubmit = () => sendRequest((isDone ? "un" : "") + "done?id=" + postID)
        .then(() => onSubmit())
        .catch(res => alert(res));
    
    // eslint-disable-next-line
    const debouncedHandler = useMemo(() => debounce(handleSubmit), [isDone])

    return (
        <Button size="large" onClick={debouncedHandler} startIcon={isDone ? <Replay/> : <Done/>}>
            {isDone ? "Vrátit" : {homework: "Hotovo", test: "Připraven", other: "Přečteno"}[type]}
        </Button>
    )
}