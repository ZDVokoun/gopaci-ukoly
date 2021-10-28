import React, { createContext, useContext, useState } from "react";
import { sendRequest } from "../helpers/http-helper.js";
const AuthContext = createContext({});
function AuthProvider({ children }) {
    const localUserJson = localStorage.getItem("user")
    const localUser = localUserJson && JSON.parse(localUserJson)
    const [user, setUser] = useState(localUser)
    const saveUser = user => {
        setUser(user)
        localStorage.setItem("user", JSON.stringify(user))
    }
    const deleteUser = () => {
        setUser(null)
        localStorage.removeItem("user")
    }
    const login = user => sendRequest("login", user).then(body => saveUser(body));
    const logout = () => sendRequest("logout", undefined).then(() => deleteUser());
    const changePassword = (password, newPassword) => sendRequest("changepassword", {password, newPassword}).then(() => logout());
    
    return (
        <AuthContext.Provider value={{ user, login, logout, changePassword }}>
        {children}
        </AuthContext.Provider>
    );
}
const useAuth = () => useContext(AuthContext);
export { useAuth, AuthProvider };