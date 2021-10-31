import { Link, Redirect } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";
import { Component } from "react";

export function Error({ msg }) {
    const { logout } = useAuth();
    if (msg === "NotFound") return <NotFound/>;
    else if (msg === "Unauthorized") {
        logout();
        return <Redirect to="login"/>
    }
    else return (<div>
        <h1>Došlo k chybě! </h1>
        <p>Pokud problém přetrvává, kontaktujte prosím správce.</p>
        <p>Popis: { msg }</p>
    </div>)
}

export function NotFound(){
    return (<div>
        <h1>404 - Stránka nenalezena</h1>
        <p>Jste se asi pokoušeli otevřít stránku, která neexistuje. Prosím, zkontrolujte zadanou adresu pro případné chyby</p>
        <Link to="/">Vrátit se domů</Link>
    </div>)
}

export class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
  
    static getDerivedStateFromError(error) { 
        return { hasError: true, error };  
    }
    componentDidCatch(error, errorInfo) { 
        // Add report service
    }
    render() {
        if (this.state.hasError) { 
          return <Error msg={this.state.error}/>;
        }
        return this.props.children; 
    }
  }