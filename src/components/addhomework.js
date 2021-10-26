import AddIcon from '@mui/icons-material/Add';
import { Select, MenuItem, Switch, FormControlLabel, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Fab, FormControl, InputLabel } from "@mui/material";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { DateTimePicker, LocalizationProvider } from "@mui/lab"
import { sendRequest } from "../helpers/http-helper.mjs";
import React, { useState, useEffect } from "react";

export function AddHomework (props) {
    const defaultSelection = {
        name: "",
        description:"",
        dueTime: new Date(),
        preciseTime: false,
        voluntary: false,
        subject: "",
        group: ""
    };
    const [open, setOpen] = useState(false);
    const handleSubmit = () => {
        let toSend = formValues;
        if (currentSubject.groups.length === 1) {
            toSend = {
                ...formValues,
                group: currentSubject.groups[0]
            }
        }
        return sendRequest("addhomework", toSend)
            .then(() => {
                setOpen(false);
                setFormValues(defaultSelection);
                props.onSubmit();  
            })
            .catch(err => alert(err));
    }
    const handleClose = () => {
        setOpen(false);
        setFormValues(defaultSelection);
    }

    const [formValues, setFormValues] = useState(defaultSelection);
    const handleInputChange = (id, value) => {
        setFormValues({
            ...formValues,
            [id]:value
        })
    }

    const [subjects, setSubjects] = useState([]);
    useEffect(() => sendRequest("getsubjects").then(res => setSubjects(res)).catch(err => alert(err)), [])

    const currentSubject = subjects.find(subject => formValues.subject === subject.shortcut);

    return (
        <div id="addHomework">
            <Fab variant="extended" size="medium" color="primary" aria-label="add" onClick={() => setOpen(true)}>
                <AddIcon sx={{ mr: 1 }} />
                Add New Homework
            </Fab>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Přidat nový úkol</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Jméno úkolu"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={event => {
                            const {id, value} = event.target;
                            return handleInputChange(id,value);
                        }}
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        label="Popis"
                        type="textarea"
                        fullWidth
                        variant="standard"
                        onChange={event => {
                            const {id, value} = event.target;
                            return handleInputChange(id,value);
                        }}
                    />
                    <br/>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <div className="dateInput">
                            <DateTimePicker
                                id="dueTime"
                                className="dueTime"
                                renderInput={(props) => <TextField {...props} />}
                                label="Čas odevzdání"
                                value={formValues.dueTime}
                                onChange={value => handleInputChange("dueTime",value)}
                            />
                        </div>
                    </LocalizationProvider>
                    <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                        <InputLabel id="subject">Předmět</InputLabel>
                        <Select
                            labelId="subject"
                            id="subject"
                            value={formValues.subject}
                            label="Předmět"
                            onChange={event => handleInputChange("subject", event.target.value)}
                        >
                            {subjects.map(item => <MenuItem key={item.shortcut} value={item.shortcut}>{item.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    {formValues.subject && currentSubject.groups.length > 1 ? 
                        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                            <InputLabel id="group">Skupina</InputLabel>
                            <Select
                                labelId="group"
                                id="group"
                                value={formValues.group}
                                label="Skupina"
                                onChange={event => handleInputChange("group", event.target.value)}
                            >
                                {currentSubject.groups.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </Select>
                        </FormControl>
                        :
                        null
                    }
                    <br/>
                    <FormControlLabel 
                        control={<Switch 
                            checked={formValues.voluntary}
                            onChange={event => handleInputChange("voluntary", event.target.checked)}
                        />} 
                        label="Dobrovolné" 
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Zavřít</Button>
                    <Button onClick={handleSubmit}>Zveřejnit</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}