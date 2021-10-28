import { sendRequest } from "../helpers/http-helper.js";
import React, { useState, useEffect } from "react";
import { Box, FormControlLabel, Skeleton, Switch } from "@mui/material";
import { AddHomework } from "../components/addhomework";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { startOfWeek, format, parse, getDay } from "date-fns";
import { cs } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Agenda } from "../components/agendaview";

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

export function Homeworks (props) {
    const [homeworks, setHomeworks] = useState(null);
    const [settings, setSettings] = useState({homeworks: {}});

    const getHomeworks = () => sendRequest("gethomeworks").then(data => setHomeworks(data)).catch(err => alert(err));
    const handleSettingsChange = event => {
        setSettings({...settings, homeworks: {[event.target.id]: event.target.checked}});
        console.log(settings)
    }
    const updateList = () => setTimeout(() => {
        setHomeworks(null);
        getHomeworks();
    }, 1000)

    useEffect(() => {
        const localSettingsJSON = localStorage.getItem("settings");
        const localSettings = localSettingsJSON && JSON.parse(localSettingsJSON);
        localSettings && setSettings(localSettings);
        getHomeworks();
    }, []);
    useEffect(() => localStorage.setItem("settings", JSON.stringify(settings)), [settings])

    return homeworks === null ? <div><br/><Skeleton variant="rectangle"/></div> : (
        <div id="homeworks">
            <Box sx={{display: {xs: "none", sm: "block"}, height: "100%"}}>
                <Calendar
                    culture="cs-CZ"
                    views={["month"]}
                    localizer={localizer}
                    events={homeworks
                        .filter(homework => homework.voluntary ? settings.homeworks.showVoluntary : true)
                        .map(homework => {return {"title": homework.name, "start": new Date(homework.dueTime), end: new Date(homework.dueTime), "allDay": true, resource: {id: homework.id, voluntary: homework.voluntary}}})
                    }
                    onDoubleClickEvent={homework => props.history.push("/homework/" + homework.resource.id)}
                    eventPropGetter={event => event.resource.voluntary ? {style: {backgroundColor: "#314aad"}} : null}
                />
            </Box>
            <Agenda history={props.history} homeworks={homeworks.filter(homework => homework.voluntary ? settings.homeworks.showVoluntary : true)} sx={{display: { xs: 'block', sm: 'none' }}}/>
            <AddHomework onSubmit={updateList}/>
            <FormControlLabel
                control={<Switch 
                    id="showVoluntary"
                    checked={settings.homeworks.showVoluntary}
                    onChange={handleSettingsChange}
                />}
                label="Zobrazit dobrovolné"
            />
        </div>
    )
}