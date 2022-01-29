import { Button } from "@mui/material";
import { useMemo } from "react";
import http, { debounce } from "../helpers/http-helper";
import { Done, Replay } from '@mui/icons-material';

export default function DoneButton({ postID, type = "homework", isDone = false, onSubmit = () => {} }) {
    const handleSubmit = () => {
        const changeDone = isDone ? http.delete : http.put;
        return changeDone("/api/content/done/" + postID)
            .then(() => onSubmit())
            .catch(res => alert(res));
    }
    
    // eslint-disable-next-line
    const debouncedHandler = useMemo(() => debounce(handleSubmit), [isDone])

    return (
        <Button size="large" onClick={debouncedHandler} startIcon={isDone ? <Replay/> : <Done/>}>
            {isDone ? "Vrátit" : {homework: "Hotovo", test: "Připraven", other: "Přečteno"}[type]}
        </Button>
    )
}
