import * as React from 'react';
import { CSSProperties, useState } from 'react';
import { connect, Dispatch } from 'react-redux';
import { Button, InputGroup, Intent } from '@blueprintjs/core';
import * as actions from '../actions';
import { DEFAULT_SERVICE_URL } from '../initial-state';
import { State } from '../state';

import cateIcon from '../resources/cate-icon-512.png';


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

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppModePageProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppModePageProps {
    return {};
}

const _AppModePage: React.FC<IAppModePageProps & IDispatch> = (props) => {

    const [webAPIServiceURL, setWebAPIServiceURL] = useState(DEFAULT_SERVICE_URL);

    const setCustomURLMode = () => {
        props.dispatch(actions.setWebAPIProvision('CustomURL', webAPIServiceURL) as any);
    };

    const setCateHubMode = () => {
        props.dispatch(actions.setWebAPIProvision('CateHub') as any);
    };

    const resetURL = () => {
        setWebAPIServiceURL(DEFAULT_SERVICE_URL);
    };

    return (
        <div style={CENTER_DIV_STYLE}>
            <div style={BOX_STYLE}>
                <h2 style={{textAlign: 'center'}}>Select Cate Service</h2>

                <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center'}}>
                    <img src={cateIcon} width={128} height={128} alt={'Cate icon'}/>
                </div>

                <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center'}}>
                    Please select a Cate service provision mode
                </div>

                <Button className={'bp3-large'}
                        intent={Intent.PRIMARY}
                        style={{marginTop: 16}}
                        onClick={setCateHubMode}>
                    CateHub Service Provider
                </Button>
                <Button className={'bp3-large'}
                        style={{marginTop: 16}}
                        disabled={!isValidURL(webAPIServiceURL)}
                        onClick={setCustomURLMode}>
                    Service at given URL
                </Button>
                <div style={{marginTop: 6}}>
                    <InputGroup
                        value={webAPIServiceURL}
                        onChange={(event) => setWebAPIServiceURL(event.textValue)}
                        placeholder="Service URL"
                        large={true}
                        rightElement={
                            <Button icon={'reset'}
                                    minimal={true}
                                    disabled={webAPIServiceURL === DEFAULT_SERVICE_URL}
                                    onClick={resetURL}/>
                        }
                    />
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