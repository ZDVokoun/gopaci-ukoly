import { sendRequest } from "../helpers/http-helper.js";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { cs } from "date-fns/locale"
import { AddComment, Comments } from "../components/comment";
import { Error } from "./error";
import { useAuth } from "../providers/auth-provider.js";
import { EditHomework } from "../components/addhomework.js";
import Loading from "../components/loading"
import DoneButton from "../components/doneButton.js";
import { Button } from "@mui/material";
import ArrowBack from '@mui/icons-material/ArrowBackIosNew';

export default function Homework(props) {
    const { user } = useAuth();
    const { id } = useParams();
    const [homework, setHomework] = useState(null);
    const [error, setError] = useState(null);
    const getHomework = () => sendRequest(`gethomeworks?id=${id}`)
        .then(res => setHomework(res))
        .catch(err => setError(err));
    useEffect(() => {
        if (!id || id === ":id") props.history.push("/homeworks");
        getHomework();
        // eslint-disable-next-line
    }, []);
    return (homework === null ? (error ? <Error msg={error} /> : <Loading/>) :
        (<div className="homework">
            <div style={{paddingTop: 10}}>
                <Button size="large" startIcon={<ArrowBack/>} onClick={() => props.history.push("/homeworks")}>Zpět</Button>
                <DoneButton postID={id} isDone={homework.done} type={homework["type"]} onSubmit={getHomework} />
            </div>
            <div>
                <h1>{homework.name}</h1>
                <p>Termín: {format(new Date(homework.dueTime), "EEEE d. MMMM y H:mm", { locale: cs })}</p>
                <p>Předmět: {homework.subjectFullName}</p>
                <h3>Popis:</h3>
                <p>{homework.description || ""}</p>
                { homework.user === user.username ? 
                <EditHomework postID={id} prevData={homework} onSubmit={getHomework}/>
                :
                [<h3>Tvůrce:</h3>,
                <p>{homework.userFullName}</p>]
                }
                <hr/>
                <AddComment disabled={false} id={id}/>
                <hr/>
                <Comments comments={homework.comments.map(item => {return {...item, createDate: new Date(item.createDate)}})}/>
            </div>
        </div>)
        
    )
}
