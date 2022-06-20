import { Button, Checkbox, Icon, InputGroup, Intent, Spinner, Tooltip } from '@blueprintjs/core';
import { useKeycloak } from '@react-keycloak/web'
import * as React from 'react';
import { CSSProperties, useEffect, useState } from 'react';
import { connect, Dispatch } from 'react-redux';
import { useHistory } from "react-router-dom";

import { TermsAndConditions } from '../components/TermsAndConditions';
import { DEFAULT_SERVICE_URL } from '../initial-state';
import cateIcon from '../resources/cate-icon-512.png';
import { State } from '../state';
import GdprBanner from './GdprBanner';
import VersionTags from './VersionTags';


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
    hubOk?: boolean;
    hubMessage?: string | null;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppModePageProps {
    const hubStatus = state.communication.hubStatus;
    return {
        hubOk: !!hubStatus && hubStatus.status === 'ok',
        hubMessage: hubStatus && hubStatus.message,
    };
}

const _AppModePage: React.FC<IAppModePageProps & IDispatch> = (
    {
        hubOk,
        hubMessage
    }) => {

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

                {hubOk && (
                    <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center', maxWidth: 360}}>
                        Please select a Cate service provision mode
                    </div>
                )}

                {hubMessage && (
                    <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center', maxWidth: 360}}>
                        <Icon icon="warning-sign" intent={Intent.WARNING}/>&nbsp;{hubMessage}
                    </div>
                )}

                <Button className={'bp3-large'}
                        intent={Intent.PRIMARY}
                        style={{marginTop: 18}}
                        onClick={setCateHubMode}
                        disabled={!keycloakInitialized || !termsAndConditionsAgreed || !hubOk}
                        rightIcon={hubOk ? null : !keycloakInitialized && <Spinner size={16}/>}
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
                        disabled={!hubOk}
                    >
                        I agree to the&nbsp;<TermsAndConditions/>
                    </Checkbox>
                    <a
                        href="https://climate.esa.int/en/helpdesk"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Click here in case you need support
                    </a>
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
            <div style={{position: "absolute", bottom: 4, right: 4}}><VersionTags/></div>
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