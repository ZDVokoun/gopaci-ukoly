import AddIcon from '@mui/icons-material/Add';
import { CircularProgress, Select, MenuItem, Switch, FormControlLabel, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Fab, FormControl, InputLabel } from "@mui/material";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { DateTimePicker, LocalizationProvider } from "@mui/lab"
import { sendRequest } from "../helpers/http-helper.js";
import { useState, useEffect } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { getCache, setCache } from "../helpers/cache-helper"
import cs from "date-fns/locale/cs"


function AddHomeworkDialog({open, setOpen, onSubmit, inputData}) {
    const defaultSelection = {
        name: "",
        description:"",
        type: "homework",
        dueTime: new Date(),
        voluntary: false,
        subject: "",
        group: ""
    };
    const postTypes = [{name: "Domácí úkol", id: "homework"}, {name: "Test", id: "test"}, {name: "Ostatní", id: "other"}];
    const dataFromProps = input => {
        let filteredInput = Object.fromEntries(Object.entries(input).filter(([key, val]) => Object.keys(defaultSelection).includes(key)));
        filteredInput.dueTime = new Date(filteredInput.dueTime);
        return Object.assign(defaultSelection, filteredInput);
    }
    const [formValues, setFormValues] = useState(inputData ? dataFromProps(inputData) : defaultSelection);
    const [subjects, setSubjects] = useState([]);
    const [submited, setSubmited] = useState(false)
    useEffect(() => {
        const subjectCache = getCache("subjects")
        subjectCache && setSubjects(subjectCache)
        sendRequest("getsubjects")
            .then(res => {
                setSubjects(res)
                setCache("subjects", res)
            })
            .catch(err => alert(err))
    }, [])

    const currentSubject = subjects.find(subject => formValues.subject === subject.shortcut);

    const handleClose = () => {
        setOpen(false);
        setFormValues(defaultSelection);
    }

    const handleInputChange = (id, value) => {
        setFormValues({
            ...formValues,
            [id]:value
        })
        console.log(formValues)
    }

    const handleSubmit = () => {
        setSubmited(true);
        let toSend = formValues;
        if (currentSubject && currentSubject.groups.length === 1) {
            toSend = {
                ...formValues,
                group: currentSubject.groups[0]
            }
        }
        if (formValues && formValues.type !== "homework") {
            toSend = {
                ...toSend,
                voluntary: undefined
            }
        }
        return onSubmit(toSend)
            .then(() => {
                setOpen(false);
                setFormValues(defaultSelection);
            })
            .catch(err => alert(err))
            .finally(() => setSubmited(false));
    }


    return (<Dialog open={open} onClose={() => setOpen(false)}>
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
            value={formValues.name}
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
            multiline
            variant="standard"
            value={formValues.description}
            onChange={event => {
                const {id, value} = event.target;
                return handleInputChange(id,value);
            }}
        />
        <br/>
        <LocalizationProvider dateAdapter={AdapterDateFns} locale={cs}>
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
            <InputLabel id="type">Typ příspěvku</InputLabel>
            <Select
                labelId="type"
                id="type"
                value={formValues.type}
                label="Typ příspěvku"
                onChange={event => handleInputChange("type", event.target.value)}
            >
              { postTypes.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>) }
            </Select>
        </FormControl>
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
        {formValues.subject && currentSubject && currentSubject.groups.length > 1 ?
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="group">Skupina</InputLabel>
                <Select
                    labelId="group"
                    id="group"
                    value={formValues.group}
                    label="Skupina"
                    onChange={event => handleInputChange("group", event.target.value)}
                >
                    {currentSubject && currentSubject.groups.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
            </FormControl>
            :
            null
        }
        <br/>
        { formValues.type === "homework" ?
            <FormControlLabel
                control={<Switch
                    checked={formValues.voluntary}
                    onChange={event => handleInputChange("voluntary", event.target.checked)}
                />}
                label="Dobrovolné"
            />
            :
            null
        }
    </DialogContent>
    <DialogActions>
        <Button onClick={handleClose}>Zavřít</Button>
            <Button onClick={handleSubmit}>{ submited && <CircularProgress size="14px" style={{marginRight: 10}}/> } Zveřejnit</Button>
    </DialogActions>
</Dialog>)
}

export function AddHomework (props) {
    const [open, setOpen] = useState(false);
    const handleSubmit = formValues => sendRequest("addhomework", formValues)
        .then(res => {
            if (props.onSubmit) props.onSubmit();
            return res;
        })
    return (
        <div id="addHomework">
            <Fab variant="extended" size="medium" color="primary" aria-label="add" onClick={() => setOpen(true)}>
                <AddIcon sx={{ mr: 1 }} />
                Přidat nový úkol
            </Fab>
            <AddHomeworkDialog open={open} setOpen={setOpen} onSubmit={handleSubmit}/>
        </div>
    )
}

export function EditHomework(props) {
    const [open, setOpen] = useState(false);
    const handleSubmit = (formValues) => sendRequest(`addhomework?id=${props.postID}`, formValues)
        .then(res => {
            if (props.onSubmit) props.onSubmit();
            return res;
        })
    return (
        <div id="edithomework">
            <Button variant="outlined" startIcon={<EditIcon />} aria-label="edit" onClick={() => setOpen(true)}>
                Upravit
            </Button>
            <AddHomeworkDialog open={open} setOpen={setOpen} onSubmit={handleSubmit} inputData={props.prevData}/>
        </div>
    )
}
