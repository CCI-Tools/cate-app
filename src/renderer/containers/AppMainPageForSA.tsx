import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import * as actions from '../actions';
import { State } from '../state';
import { showToast } from '../toast';
import AppMainPageWrapper from './AppMainPageWrapper';


function useQuery() {
    return new URLSearchParams(useLocation().search);
}

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppMainPageForSAProps {
    cookieConsentObtained: boolean;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppMainPageForSAProps {
    return {
        cookieConsentObtained: state.session.cookieConsentObtained,
    };
}

const _AppMainPageForSA: React.FC<IAppMainPageForSAProps & IDispatch> = (
    {
        cookieConsentObtained,
        dispatch,
    }
) => {
    const query = useQuery();
    const [init, setInit] = React.useState(false);
    React.useEffect(() => {
        if (!init && cookieConsentObtained) {
            const serviceUrl = query.get('serviceUrl');
            if (serviceUrl !== null) {
                dispatch(actions.connectWebAPIService(serviceUrl) as any);
            } else {
                showToast({type: 'error', text: 'Missing query parameter "serviceUrl"'});
                dispatch(actions.setWebAPIStatus(null) as any);
            }
            setInit(true);
        }
    }, [dispatch, init, setInit, query, cookieConsentObtained]);

    return (<AppMainPageWrapper/>);
}

const AppMainPageForSA = connect(mapStateToProps)(_AppMainPageForSA);
export default AppMainPageForSA;
