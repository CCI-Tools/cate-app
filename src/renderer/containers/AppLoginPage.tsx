import * as React from 'react';
import { CSSProperties } from 'react';
import { connect, Dispatch } from 'react-redux';
import * as actions from '../actions';
import { Button, InputGroup, Intent } from '@blueprintjs/core';
import cateIcon from '../resources/cate-icon-512.png';
import { State } from '../state';

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
    alignItems: 'stretch'
};

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppLoginPageProps {
    username: string;
    password: string;
}

function mapStateToProps(state: State): IAppLoginPageProps {
    return {
        username: state.communication.username,
        password: state.communication.password,
    };
}

const _AppLoginPage: React.FC<IAppLoginPageProps & IDispatch> = (props) => {
    const password = props.password;
    const username = props.username;

    const login = () => {
        props.dispatch(actions.login() as any);
    };

    const back = () => {
        props.dispatch(actions.setWebAPIProvision(null) as any);
    };

    const setUsername = (username: string) => {
        props.dispatch(actions.setUserCredentials(username, password));
    };

    const setPassword = (password: string) => {
        props.dispatch(actions.setUserCredentials(username, password));
    };

    const hasCredentials = !!(username && password);

    return (
        <div style={CENTER_DIV_STYLE}>
            <div style={BOX_STYLE}>
                <h1 style={{textAlign: 'center'}}>Cate Software-as-a-Service Login</h1>

                <div style={{marginTop: 12, alignContent: 'center', textAlign: 'center'}}>
                    <img src={cateIcon} width={128} height={128} alt={'Cate icon'}/>
                </div>

                {/*<div style={{marginTop: 24, alignContent: 'center', textAlign: 'center', display: 'flex'}}>*/}
                {/*<img width={32} height={32} src={'resources/resources/github-120.png'} alt={'github icon'}/>*/}
                {/*<span>&nbsp;&nbsp;&nbsp;</span>*/}
                {/*<Button onClick={signIn} intent={Intent.PRIMARY} className={'bp3-large'}>Using your GitHub*/}
                {/*Account</Button>*/}
                {/*</div>*/}
                {/*<h4 style={{marginTop: 24}}>or</h4>*/}
                {/*<p style={{marginTop: 24, alignSelf: 'center'}}>Using your CateHub Account</p>*/}

                <div style={{marginTop: 12, alignSelf: 'stretch'}}>
                    <InputGroup
                        className={'bp3-large'}
                        placeholder="Enter your username..."
                        type={'text'}
                        leftIcon={'user'}
                        value={username || ''}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>
                <div style={{marginTop: 6, alignSelf: 'stretch'}}>
                    <InputGroup
                        className={'bp3-large'}
                        placeholder="Enter your password..."
                        type={'password'}
                        leftIcon={'key'}
                        value={password || ''}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>
                <div style={{marginTop: 8, alignSelf: 'flex-end'}}>
                    <Button
                        className={'bp3-large'}
                        icon={'arrow-left'}
                        style={{marginRight: 6}}
                        onClick={back}
                    >
                        Back
                    </Button>
                    <Button
                        className={'bp3-large'}
                        icon={'log-in'}
                        intent={Intent.PRIMARY}
                        onClick={login}
                        disabled={!hasCredentials}
                        autoFocus={true}
                    >
                        Login
                    </Button>
                </div>
                <div style={{marginTop: 18, alignSelf: 'center'}}>
                    <span>Don't have an account yet?&nbsp;</span><a
                    href={'mailto:climate.office@esa.int?subject=Apply%20for%20ESA%20CCI%20Toolbox'}>Apply!</a>
                </div>
            </div>
        </div>
    );
}

const AppLoginPage = connect(mapStateToProps)(_AppLoginPage);
export default AppLoginPage;
