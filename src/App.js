import './App.css';
import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";
import { Login } from './pages/login';
import Sidebar from './components/sidebar';
import { PrivateRoute } from "./components/privateroute";
import { Homeworks } from './pages/homeworks';
import { Homework } from './pages/homework';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" exact component={Login} />
        <div id="main">
          <Sidebar/>
          <Switch>
            <Route exact path="/">
              <Redirect to="/homeworks"/>
            </Route>
            <PrivateRoute path="/homeworks" exact component={Homeworks}/>
            <Route exact path="/homework">
              <Redirect to="/homeworks"/>
            </Route>
            <PrivateRoute path="/homework/:id" component={() => <Homework/>}/>
            <Route component={() => <h1>404 Not Found</h1>} />
          </Switch>
        </div>
        
      </Switch>
    </Router>
  );
}

export default App;
