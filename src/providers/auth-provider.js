import React, { createContext, useContext, useState } from "react";
import { sendRequest } from "../helpers/http-helper.mjs";
const AuthContext = createContext({});
function AuthProvider({ children }) {
    const localUserJson = localStorage.getItem("user")
    const localUser = localUserJson && JSON.parse(localUserJson)
    const [user, setUser] = useState(localUser)
    const [redirectLink, setRedirectLink] = useState("");
    const saveUser = user => {
        setUser(user)
        localStorage.setItem("user", JSON.stringify(user))
    }
    const deleteUser = () => {
        setUser(null)
        localStorage.removeItem("user")
    }
    const signup = user => sendRequest("signup", user).then(body => saveUser(body)).catch(error => alert(error));
    const login = user => sendRequest("login", user).then(body => saveUser(body)).catch(error => alert(error));
    const logout = () => sendRequest("logout", undefined).then(() => deleteUser()).catch(error => alert(error));
    
    return (
        <AuthContext.Provider value={{ user, signup, login, logout, redirectLink, setRedirectLink }}>
        {children}
        </AuthContext.Provider>
    );
}
const useAuth = () => useContext(AuthContext);
export { useAuth, AuthProvider };