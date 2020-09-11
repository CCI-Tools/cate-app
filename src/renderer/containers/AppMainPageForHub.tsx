import { useKeycloak } from '@react-keycloak/web';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import * as actions from '../actions';
import { State } from '../state';
import AppMainPage from './AppMainPage';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppMainPageForHubProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppMainPageForHubProps {
    return {};
}

const _AppMainPageForHub: React.FC<IAppMainPageForHubProps & IDispatch> = (
    {
        dispatch,
    }
) => {
    // const [init, setInit] = React.useState(false);
    const [keycloak, keycloakInitialized] = useKeycloak();
    React.useEffect(() => {
        if (keycloakInitialized) {
            dispatch(actions.launchWebAPIService(keycloak) as any);
        } else {
            dispatch(actions.setWebAPIStatus('login') as any);
        }
    }, [dispatch, keycloak, keycloakInitialized]);

    return (<AppMainPage/>);
}


const AppMainPageForHub = connect(mapStateToProps)(_AppMainPageForHub);
export default AppMainPageForHub;
