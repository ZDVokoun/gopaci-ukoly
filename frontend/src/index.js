import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './providers/auth-provider';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { csCZ } from "@mui/material/locale"

const localize = createTheme({}, csCZ)

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider theme={localize}>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
