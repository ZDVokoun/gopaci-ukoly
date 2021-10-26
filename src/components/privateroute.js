import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";

export function PrivateRoute({ component:Component, path, ...rest }) {
    const { user, setRedirectLink } = useAuth();
    setRedirectLink(path);
    return (
        <Route {...rest} render={props => { 
                return user ? 
                <Component {...props}/>
                : 
                <Redirect from={path} to="/login"/>
            }
        }/>
    )
}