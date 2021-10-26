import { sendRequest } from "../helpers/http-helper.mjs";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@mui/material";
import { format } from "date-fns";
import { cs } from "date-fns/locale"
import { AddComment, Comments } from "../components/comment";
import { useAuth } from "../providers/auth-provider";

export function Homework(props) {
    const { id } = useParams();
    const { logout } = useAuth();
    const [homework, setHomework] = useState(null);
    useEffect(() => {
        if (!id || id === ":id") props.history.push("/homeworks");
        sendRequest(`gethomeworks?id=${id}`)
            .then(res => setHomework(res))
            .catch(err => {
                if (err === "Unauthorized") return logout();
                alert(err);
            });
    }, []);
    return (homework === null ? <div><br/><Skeleton variant="text"/></div> :
        <div className="homework">
            <h1>{homework.name}</h1>
            <p>Termín: {format(new Date(homework.dueTime), "EEEE d MMMM y", { locale: cs })}</p>
            <h3>Popis:</h3>       
            <p>{homework.description || ""}</p>
            <h3>Tvůrce:</h3>
            <p>{homework.userFullName}</p>
            <hr/>
            <AddComment disabled={false} id={id}/>
            <hr/>
            <Comments comments={homework.comments.map(item => {return {...item, createDate: new Date(item.createDate)}})}/>
        </div>
        
    )
}