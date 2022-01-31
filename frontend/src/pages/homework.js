import http from "../helpers/http-helper.js";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { cs } from "date-fns/locale"
import { AddComment, Comments } from "../components/comment";
import { Error } from "./error";
import { useAuth } from "../providers/auth-provider.js";
import { EditHomework } from "../components/addhomework.js";
import DoneButton from "../components/doneButton.js";
import { Button } from "@mui/material";
import ArrowBack from '@mui/icons-material/ArrowBackIosNew';
import { getCache, setCache } from "../helpers/cache-helper"
import { ReloadButton } from "../components/buttonsWithProgress"

export default function Homework(props) {
    const { user } = useAuth();
    const { id } = useParams();
    const [homework, setHomework] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const getHomework = () => {
        setIsLoading(true)
        return http.get(`/api/content/homework/${id}`)
            .then(res => {
                setHomework(res);
                setCache("homework" + id, res)
                setIsLoading(false)
            })
            .catch(err => setError(err));
    }
    const switchDoneValue = () => {
        const switched = {...homework, done: !homework.done}
        setHomework(switched)
        setCache("homework" + id, switched)
    }
    useEffect(() => {
        if (!id || id === ":id") props.history.push("/homeworks");
        const homeworkCache = getCache("homework" + id)
        homeworkCache && setHomework(homeworkCache)
        getHomework();
        // eslint-disable-next-line
    }, []);
    return (error ? <Error msg={error} /> :
        (<div className="homework">
           <div style={{paddingTop: 10, display: "flex"}}>
                <Button size="large" startIcon={<ArrowBack/>} onClick={() => props.history.push("/homeworks")}>Zpět</Button>
                <DoneButton postID={id} isDone={homework.done} type={homework["type"]} onSubmit={switchDoneValue} />
                <div style={{flexGrow: 1}}></div>
                <ReloadButton isLoading={isLoading} onClick={getHomework}/>
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
