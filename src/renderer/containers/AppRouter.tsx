import * as React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { State, HubStatus } from '../state';
import AppMainPageForHub from '../containers/AppMainPageForHub';
import AppMainPageForSA from './AppMainPageForSA';
import AppModePage from './AppModePage';


interface IAppRouterProps {
    hubStatus: HubStatus | null;
}

function mapStateToProps(state: State): IAppRouterProps {
    return {
        hubStatus: state.communication.hubStatus
    };
}

const AppRouter: React.FC<IAppRouterProps> = ({hubStatus}) => {
    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    <AppModePage/>
                </Route>
                <Route path="/sa">
                    <AppMainPageForSA/>
                </Route>
                <Route path="/hub">
                    {
                        (hubStatus === null || hubStatus.status !== 'ok')
                        ? (<Redirect to="/"/>)
                        : (<AppMainPageForHub/>)
                    }
                </Route>
            </Switch>
        </Router>
    );
}

export default connect(mapStateToProps)(AppRouter);
