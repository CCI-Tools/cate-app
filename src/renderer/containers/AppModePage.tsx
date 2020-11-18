import * as React from 'react';
import { CSSProperties, useEffect, useState } from 'react';
import { connect, Dispatch } from 'react-redux';
import { useHistory } from "react-router-dom";
import { useKeycloak } from '@react-keycloak/web'
import { Button, Checkbox, Icon, InputGroup, Intent, Spinner, Tooltip } from '@blueprintjs/core';
import GdprBanner from '../components/GdprBanner';

import { TermsAndConditions } from '../components/TermsAndConditions';
import { DEFAULT_SERVICE_URL } from '../initial-state';
import { State } from '../state';

import cateIcon from '../resources/cate-icon-512.png';


const maintenanceReason: string | undefined = process.env.REACT_APP_CATEHUB_MAINTENANCE;

const CENTER_DIV_STYLE: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
};

const BOX_STYLE: CSSProperties = {
    display: 'flex',
    flexFlow: 'column nowrap',
    alignItems: 'stretch',
};

const SA_MODE_LINK_STYLE: CSSProperties = {
    marginTop: 4,
    textAlign: 'center',
};

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppModePageProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppModePageProps {
    return {};
}

const _AppModePage: React.FC<IAppModePageProps & IDispatch> = () => {

    const history = useHistory();
    const [, keycloakInitialized] = useKeycloak();
    const [webAPIServiceURL, setWebAPIServiceURL] = useState(DEFAULT_SERVICE_URL);
    const [termsAndConditionsAgreed, setTermsAndConditionsAgreed] = useState(false);

    useEffect(() => {
        try {
            const webAPIServiceURL = window.localStorage.getItem('serviceUrl');
            if (webAPIServiceURL !== null) {
                setWebAPIServiceURL(webAPIServiceURL);
            }
        } catch (e) {
            // ok
        }
    }, []);

    const setCustomURLMode = () => {
        try {
            window.localStorage.setItem('serviceUrl', webAPIServiceURL);
        } catch (e) {
            // ok
        }
        history.push(`/sa?serviceUrl=${encodeURI(webAPIServiceURL)}`)
    };

    const setCateHubMode = () => {
        history.push('/hub')
    };

    const handleTermsAndConditionsAgreedChange = (e: React.FormEvent<HTMLInputElement>) => {
        setTermsAndConditionsAgreed(e.currentTarget.checked);
    };

    const resetURL = () => {
        setWebAPIServiceURL(DEFAULT_SERVICE_URL);
    };

    return (
        <div style={CENTER_DIV_STYLE}>
            <GdprBanner/>
            <div style={BOX_STYLE}>
                <h1 style={{textAlign: 'center'}}>Select Cate Service</h1>

                <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center'}}>
                    <img src={cateIcon} width={128} height={128} alt={'Cate icon'}/>
                </div>

                {maintenanceReason ? (
                    <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center', maxWidth: 320}}>
                        <Icon icon="warning-sign" intent={Intent.WARNING}/>&nbsp;{maintenanceReason}
                    </div>
                ) : (
                    <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center', maxWidth: 320}}>
                        Please select a Cate service provision mode
                    </div>
                )}
                <Button className={'bp3-large'}
                        intent={Intent.PRIMARY}
                        style={{marginTop: 18}}
                        onClick={setCateHubMode}
                        disabled={!keycloakInitialized || !termsAndConditionsAgreed || Boolean(maintenanceReason)}
                        rightIcon={maintenanceReason ? null : !keycloakInitialized && <Spinner size={16}/>}
                >
                    <Tooltip content={<div>Obtain a new Cate service instance<br/>in the cloud (CateHub
                        Software-as-a-Service).<br/>Requires login information.</div>}>
                        Cate Cloud Service
                    </Tooltip>
                </Button>
                <div style={SA_MODE_LINK_STYLE}>
                    <Checkbox
                        checked={termsAndConditionsAgreed}
                        onChange={handleTermsAndConditionsAgreedChange}
                        disabled={Boolean(maintenanceReason)}
                    >
                        I agree to the&nbsp;<TermsAndConditions/>
                    </Checkbox>
                </div>
                <Button className={'bp3-large'}
                        style={{marginTop: 18}}
                        disabled={!isValidURL(webAPIServiceURL)}
                        onClick={setCustomURLMode}>
                    <Tooltip content={<div>Use a Cate service instance on your<br/>own machine or at another known URL.
                    </div>}>
                        Cate Local Service
                    </Tooltip>
                </Button>
                <div style={{marginTop: 6}}>
                    <InputGroup
                        value={webAPIServiceURL}
                        onChange={(event) => setWebAPIServiceURL(event.target.value)}
                        placeholder="Service URL"
                        large={true}
                        rightElement={
                            <Button icon={'reset'}
                                    minimal={true}
                                    disabled={webAPIServiceURL === DEFAULT_SERVICE_URL}
                                    onClick={resetURL}/>
                        }
                    />
                    <div style={SA_MODE_LINK_STYLE}>
                        <a
                            href="https://github.com/CCI-Tools/cate#running-cate-app-in-stand-alone-mode"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            How do I run a Cate local service?
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AppModePage = connect(mapStateToProps)(_AppModePage);
export default AppModePage;

function isValidURL(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        return false;
    }
}