import { Button, Card, TextField } from "@mui/material";
import { useState, createRef, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { sendRequest } from "../helpers/http-helper.mjs";
import { format } from "date-fns";
import { cs } from "date-fns/locale"

export function AddComment (props) {
    const [input, setInput] = useState({msg: "", files: null})
    const [dragOver, setDragOver] = useState(false);
    const allowedFileTypes = ["image/jpeg", "image/png"];

    const fileListToArray = list => {
        const array = [];
        for (let file of list) array.push(file);
        return array;
    }
    const handleSubmit = async () => {
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
        console.log(input)
        const compressed = []
        for (let file of input.files) {
            const compressedImg = await imageCompression(file, compressionOptions);
            console.log((await compressedImg.arrayBuffer()).byteLength)
            compressed.push(compressedImg);
        }
        let data = []
        for (let file of compressed) data.push({name: file.name, type: file.type, content: await blobToBase64(file)});
        console.log(data)
        const imgIDs = await fetch("/.netlify/functions/uploadimages", {"method": "POST", headers:{"Content-Type": "application/json"}, body: JSON.stringify(data)}).then(res => res.json()).catch(err => alert(err))
        return sendRequest("addcomment", {msg: input.msg, homework: props.id, images: imgIDs}).then(() => setInput({msg: "", files: null})).catch(err => alert(err))
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
    }, [])

    return (<div>
        <h2>Přidat komentář:</h2>
        <TextField
            label="Komentář"
            fullWidth
            multiline 
            value={input.msg}
            sx={dragOver ? {'& .MuiOutlinedInput-root fieldset': {borderColor: "blue"}}: {}}
            ref={textFieldRef}
            onChange={event => setInput({...input, msg: event.target.value})}
        />
        <Button onClick={openFileDialog}>Přidat řešení</Button>
        <Button onClick={handleSubmit}>Publikovat</Button>
        <p>Přidáno: {input.files ? <ul>{input.files.map(file => <li>{file.name}</li>)}</ul> : "nic"}</p>
        <input ref={fileInputRef} type="file" accept={allowedFileTypes.join(", ")} style={{display:"none"}} multiple onChange={handleFileChange} />
    </div>)
}
function Comment ({msg, userFullName, images, createDate}) {
    console.log(createDate)
    return (<Card variant="outlined" className="comment">
        <p className="commentAuthor">{userFullName}</p>
        <small>Napsáno: {format(createDate, "EEEE d MMMM y", { locale: cs })}</small>
        <p>{msg}</p>
        <div className={images && images.length > 1 ? "gallery" : null}>
            {images && images.map(img => <img src={`/.netlify/functions/getimage?id=${img}`}></img>)}
        </div>
    </Card>)
}
export function Comments ({comments}) {
    console.log(comments)
    return (<div>
        <h2>Komentáře:</h2>
        {comments.sort((first,second) => first.createDate - second.createDate).map(comment => <Comment {...comment}/>)}
    </div>)
}