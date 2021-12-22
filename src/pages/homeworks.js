import { sendRequest } from "../helpers/http-helper.js";
import React, { useState, useEffect } from "react";
import { Box, FormControlLabel, Switch } from "@mui/material";
import { AddHomework } from "../components/addhomework";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { startOfWeek, format, parse, getDay } from "date-fns";
import { cs } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Agenda } from "../components/agendaview";
import Loading from "../components/loading.js";
import { Error } from "./error.js";
import { getCache, setCache } from "../helpers/cache-helper"

const locales = {
    "cs-CZ": cs
}
  
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales
})

export default function Homeworks (props) {
    const [homeworks, setHomeworks] = useState(null);
    const [settings, setSettings] = useState({homeworks: {}});
    const [error, setError] = useState(null);

    const getHomeworks = () => sendRequest("gethomeworks")
            .then(data => {
                setHomeworks(data)
                setCache("homeworks", data);
            })
            .catch(err => setError(err));
    const getSettings = () => {
        const localSettingsJSON = localStorage.getItem("settings");
        const localSettings = localSettingsJSON && JSON.parse(localSettingsJSON);
        localSettings && setSettings(localSettings);
    }
    const handleSettingsChange = event => {
        let newSettings = {...settings, homeworks: {...settings.homeworks, [event.target.id]: event.target.checked, }}
        setSettings(newSettings);
        localStorage.setItem("settings", JSON.stringify(newSettings))
    }
    const updateList = () => setTimeout(() => {
        getHomeworks();
    }, 1000)

    useEffect(() => {
        getSettings();
        let homeworksCache = getCache("homeworks")
        console.log(homeworksCache)
        homeworksCache && setHomeworks(homeworksCache)
        getHomeworks();
    }, []);

    return homeworks === null ? (error ? <Error msg={error} /> : <Loading/>) : (
        <div id="homeworks">
            <Box sx={{display: {xs: "none", sm: "block"}, height: "90%"}}>
                <Calendar
                    culture="cs-CZ"
                    views={["month"]}
                    localizer={localizer}
                    events={homeworks
                        .filter(homework => homework.voluntary ? settings.homeworks.showVoluntary : true)
                        .filter(homework => homework.done ? settings.homeworks.showDone : true)
                        .map(homework => {
                            const color = homework.done ? "rgb(27, 125, 52)" : (homework.voluntary ? "rgb(66, 37, 204)" : {homework: "#1976d2", test: "rgb(34, 60, 200)", other: "#19a7d2"}[homework.type]);
                            return {"title": homework.name, "start": new Date(homework.dueTime), end: new Date(homework.dueTime), "allDay": true, resource: {id: homework.id, color}
                        }})
                    }
                    onDoubleClickEvent={homework => props.history.push("/homework/" + homework.resource.id)}
                    eventPropGetter={event => ({style: {backgroundColor: event.resource.color}})}
                    popup
                />
            </Box>
            <Agenda 
                history={props.history} 
                homeworks={
                    homeworks
                        .filter(homework => homework.voluntary ? settings.homeworks.showVoluntary : true)
                        .filter(homework => homework.done ? settings.homeworks.showDone : true)
                } 
                sx={{display: { xs: 'block', sm: 'none' }}}
            />
            <AddHomework onSubmit={updateList}/>
            <div>
                <FormControlLabel
                    control={<Switch 
                        id="showVoluntary"
                        checked={settings.homeworks.showVoluntary}
                        onChange={handleSettingsChange}
                    />}
                    label="Zobrazit dobrovolné"
                />
                <FormControlLabel
                    control={<Switch 
                        id="showDone"
                        checked={settings.homeworks.showDone}
                        onChange={handleSettingsChange}
                    />}
                    label="Zobrazit hotové"
                />
            </div>
            
        </div>
    )
}
