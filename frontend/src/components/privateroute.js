import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";

export function PrivateRoute({ component:Component, path, ...rest }) {
    const { user } = useAuth();
    return (
        <Route {...rest} render={props => { 
                return user ? 
                <Component {...props}/>
                : 
                <Redirect to={{pathname: "/login", state: {prevPath: props.location}}}/>
            }
        }/>
    )
}