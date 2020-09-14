import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import * as actions from '../actions';
import { State } from '../state';
import { showToast } from '../toast';
import AppMainPage from './AppMainPage';



function useQuery() {
    return new URLSearchParams(useLocation().search);
}


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppMainPageForSAProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppMainPageForSAProps {
    return {
    };
}

const _AppMainPageForSA: React.FC<IAppMainPageForSAProps & IDispatch> = (
    {
        dispatch,
    }
) => {
    const query = useQuery();
    const [init, setInit] = React.useState(false);
    React.useEffect(() => {
        if (!init) {
            const serviceUrl = query.get('serviceUrl');
            if (serviceUrl !== null) {
                dispatch(actions.connectWebAPIService(serviceUrl) as any);
            } else {
                showToast({type: 'error', text: 'Missing query parameter "serviceUrl"'});
                dispatch(actions.setWebAPIStatus(null) as any);
            }
            setInit(true);
        }
    }, [dispatch, init, setInit, query]);

    return (<AppMainPage/>);
}

const AppMainPageForSA = connect(mapStateToProps)(_AppMainPageForSA);
export default AppMainPageForSA;
