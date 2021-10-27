import { Button, Card, TextField, Alert, Collapse } from "@mui/material";
import { useState, createRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { sendRequest } from "../helpers/http-helper.mjs";
import { format } from "date-fns";
import { cs } from "date-fns/locale"

export function AddComment (props) {
    const [input, setInput] = useState({msg: "", files: null})
    const [dragOver, setDragOver] = useState(false);
    const [response, setResponse] = useState({ok: null, show: false});
    const allowedFileTypes = ["image/jpeg", "image/png"];

    const fileListToArray = list => {
        const array = [];
        for (let file of list) array.push(file);
        return array;
    }
    const handleSubmit = async () => {
        const handleError = err => {
            setResponse({ok:false, msg: err, show: true});
            setTimeout(() => {
                setResponse({ok:false, msg: err, show: false});
                setTimeout(() => {
                    setResponse({ok: null, show: false})
                }, 500);
            }, 5000);
        };
        const commentSend = (data) => sendRequest("addcomment", data)
            .then(() => {
                setInput({msg: "", files: null})
                setResponse({ok: true, msg: "Úspěšně odesláno", show: true});
                setTimeout(() => {
                    setResponse({ok: true, msg: "Úspěšně odesláno", show: false});
                    setTimeout(() => {
                        setResponse({ok: null, show: false})
                        if (props.onSubmit) props.onSubmit()
                    }, 500);
                }, 5000)
            });

        if (input.files) {
            function blobToBase64(blob) {
                return new Promise((resolve, _) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result.slice(reader.result.indexOf(",") + 1));
                  reader.readAsDataURL(blob);
                });
              }
            const compressionOptions = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true
            }
            const compressed = []
            for (let file of input.files) {
                const compressedImg = await imageCompression(file, compressionOptions);
                compressed.push(compressedImg);
            }
            let data = []
            for (let file of compressed) data.push({name: file.name, type: file.type, content: await blobToBase64(file)});
            return sendRequest("uploadimages", data)
                .then(res => commentSend({msg: input.msg, homework: props.id, images: res}))
                .catch(err => handleError(err))
        } else {
            return commentSend({msg: input.msg, homework: props.id, images: []}).catch(err => handleError(err));
        }
    }
    const openFileDialog = () => {
        fileInputRef.current.click();
    }
    const handleDrop = event => {
        event.stopPropagation();
        event.preventDefault();
        setDragOver(false);
        setInput({...input, files: fileListToArray(event.dataTransfer.files).filter(file => allowedFileTypes.includes(file["type"]))})
    }
    const handleFileChange = event => {
        setInput({...input, files: fileListToArray(event.target.files)})
    }

    const fileInputRef = createRef();
    const textFieldRef = createRef();

    useEffect(() => {
        if (props.disabled) return;
        const node = textFieldRef.current;
        node.addEventListener("drop", handleDrop);
        node.addEventListener("dragover", event => {
            event.preventDefault();
            setDragOver(true);
        });
        node.addEventListener("dragleave", event => {
            event.preventDefault();            
            setDragOver(false)
        });
        // eslint-disable-next-line
    }, [])

    return (<div>
        <h2 style={{marginBottom:"15px"}}>Přidat komentář:</h2>
        <Collapse in={response.show}>
            {response.ok !== null && (response.ok ? <Alert severity="info">Úspěšně odesláno</Alert> : <Alert severity="error">Omlouváme se, došlo k chybě. Zkuste to prosím znovu. Podrobnosti: {response.msg}</Alert>)}
        </Collapse>
        <TextField
            label="Komentář *"
            fullWidth
            required
            multiline 
            value={input.msg}
            sx={Object.assign(dragOver ? {'& .MuiOutlinedInput-root fieldset': {borderColor: "blue"}}: {}, {marginTop: 1})}
            ref={textFieldRef}
            onChange={event => setInput({...input, msg: event.target.value})}
        />
        <Button onClick={openFileDialog}>Přidat řešení (volitelné)</Button>
        <Button onClick={handleSubmit}>Publikovat</Button>
        {input.files ? <p>Přidáno:<ul>{input.files.map(file => <li>{file.name}</li>)}</ul></p> : null}
        <input ref={fileInputRef} type="file" accept={allowedFileTypes.join(", ")} style={{display:"none"}} multiple onChange={handleFileChange} />
    </div>)
}
function Comment ({msg, userFullName, images, createDate}) {
    return (<Card variant="outlined" className="comment">
        <p className="commentAuthor">{userFullName}</p>
        <small>Napsáno: {format(createDate, "EEEE d. MMMM y", { locale: cs })}</small>
        <p>{msg}</p>
        <div className={images && images.length > 1 ? "gallery" : null}>
            {images && images.map(img => <img alt="" loading="lazy" src={`/.netlify/functions/getimage?id=${img}`}></img>)}
        </div>
    </Card>)
}
export function Comments ({comments}) {
    return (<div>
        <h2>Komentáře:</h2>
        {comments.length > 0 
            ? 
            comments.sort((first,second) => first.createDate - second.createDate).map(comment => <Comment {...comment}/>) 
            :
            "Nikdo zatím nic nenapsal ¯\\_(ツ)_/¯. Buďte první, kdo zde napíše komentář!"}
    </div>)
}