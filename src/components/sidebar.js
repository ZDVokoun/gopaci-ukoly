import { Redirect, withRouter } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";
import { Drawer, Fab, List, ListItem, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';

function Sidebar(props) {
    const { history } = props;
    const { logout } = useAuth();
    const logoutHandle = event => {
        event.preventDefault();
        logout();
        setOpen(false);
    }
    const handleRedirect = event => {
        history.push("/" + event.currentTarget.getAttribute("name"));
        setOpen(false);
    }
    
    const [redirect, setRedirect] = useState();
    useEffect(() => setRedirect(null), [redirect])
    
    const [open, setOpen] = useState(false);

    const items = (<List>
                    <ListItem button name="logout" onClick={logoutHandle}>
                        <ListItemText primary="Odhlásit se" />
                    </ListItem>
                    <ListItem button name="homeworks" onClick={handleRedirect}>
                        <ListItemText primary="Domácí úkoly" />
                    </ListItem>
                </List>)
    return (<div id="sidebar">
            <Drawer variant="permanent" sx={{width: 200, display: { xs: 'none', sm: 'block' }}}>
                {items}
            </Drawer>
            <Fab variant="rectangular" aria-label="open" sx={{display: {sm: "none"}, margin: 1}} onClick={() => setOpen(true)}><MenuIcon/></Fab>
            <Drawer open={open} onClose={() => setOpen(false)} sx={{width: 200, display: { xs: 'block', sm: 'none' }}}>
                {items}
            </Drawer>
            {redirect ? <Redirect to={redirect}/> : null}
        </div>)
}

export default withRouter(Sidebar);