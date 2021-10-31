import './App.css';
import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";
import { Login } from './pages/login';
import Sidebar from './components/sidebar';
import { PrivateRoute } from "./components/privateroute";
import { NotFound, ErrorBoundary } from './pages/error';
import { Settings } from './pages/settings';
import { Suspense, lazy } from 'react';
import Loading from './components/loading';
const Homeworks = lazy(() => import("./pages/homeworks"))
const Homework = lazy(() => import("./pages/homework"))

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" exact component={Login} />
        <div id="main">
          <Sidebar/>
          <ErrorBoundary>
            <Suspense fallback={<Loading/>}>
              <Switch>
                <Route exact path="/">
                  <Redirect to="/homeworks"/>
                </Route>
                <PrivateRoute path="/homeworks" exact component={Homeworks}/>
                <Route exact path="/homework">
                  <Redirect to="/homeworks"/>
                </Route>
                <PrivateRoute path="/homework/:id" component={Homework}/>
                <PrivateRoute path="/settings" component={Settings}/>
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </ErrorBoundary>
        </div>
      </Switch>
    </Router>
  );
}

export default App;
