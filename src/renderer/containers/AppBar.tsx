import { CSSProperties } from 'react';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { KeycloakProfile } from 'keycloak-js';
import {
    Button,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    Popover,
    PopoverPosition, Tooltip,
} from '@blueprintjs/core';

import * as actions from '../actions';
import { State, WebAPIProvision } from '../state';
import cateIcon from '../resources/cate-icon-128.png';
import UserMenu from './UserMenu';
import WorkspacesMenu from './WorkspacesMenu';
import FilesMenu from './FilesMenu';
import HelpMenu from './HelpMenu';


const TITLE_STYLE = {marginLeft: 10};

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppBarProps {
    webAPIProvision: WebAPIProvision;
    userProfile: KeycloakProfile | null,
    pwaInstallPromotionVisible: boolean;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppBarProps {
    return {
        webAPIProvision: state.communication.webAPIProvision,
        userProfile: state.communication.userProfile,
        pwaInstallPromotionVisible: state.control.pwaInstallPromotionVisible,
    };
}


const _AppBar: React.FC<IAppBarProps & IDispatch> = (
    {
        webAPIProvision,
        userProfile,
        pwaInstallPromotionVisible,
        dispatch,
    }
) => {

    const handlePreferencesClick = () => {
        dispatch(actions.showPreferencesDialog());
    };

    const handleShowPwaInstallPrompt = () => {
        dispatch(actions.showPwaInstallPrompt() as any);
    };

    return (
        <Navbar>
            <NavbarGroup>
                <img src={cateIcon} width={32} height={32} alt={'Cate icon'}/>
                <h2 style={TITLE_STYLE}>Cate - ESA CCI Toolbox</h2>
            </NavbarGroup>
            <NavbarGroup align="right">
                {pwaInstallPromotionVisible && (
                    <React.Fragment>
                        <Button
                            className="bp3-minimal"
                            icon="desktop"
                            intent="success"
                            onClick={handleShowPwaInstallPrompt}
                        >
                            Install App
                        </Button>
                        <NavbarDivider/>
                    </React.Fragment>
                )}
                <Popover content={<WorkspacesMenu/>} position={PopoverPosition.BOTTOM}>
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>Workspaces</Button>
                </Popover>
                <Popover content={<FilesMenu/>} position={PopoverPosition.BOTTOM}>
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>Files</Button>
                </Popover>
                <Popover content={<HelpMenu/>} position={PopoverPosition.BOTTOM}>
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>Help</Button>
                </Popover>
                {webAPIProvision === 'CateHub' && userProfile !== null && (
                    <Popover content={<UserMenu/>} position={PopoverPosition.BOTTOM}>
                        <Tooltip content={<UserInfo userProfile={userProfile}/>}>
                            <Button
                                className="bp3-minimal"
                                icon={<Avatar userProfile={userProfile}/>}
                                rightIcon={'caret-down'}
                            />
                        </Tooltip>
                    </Popover>
                )}
                <NavbarDivider/>
                <Button
                    className="bp3-minimal"
                    icon='cog'
                    onClick={handlePreferencesClick}
                />
            </NavbarGroup>
        </Navbar>
    );
}

const AppBar = connect(mapStateToProps)(_AppBar);
export default AppBar;

const AVATAR_STYLE: CSSProperties = {
    width: 28,
    height: 28,
    flex: 'none',
    borderRadius: 14,
    color: 'white',
    display: 'flex',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D7324',
};

interface AvatarProps {
    userProfile: KeycloakProfile;
}

function Avatar({userProfile}: AvatarProps) {
    const name = userProfile.firstName || userProfile.username || userProfile.email;
    const letter = ((name && name.length && name[0]) || 'U').toUpperCase();
    return (<div style={AVATAR_STYLE}>{letter}</div>);
}


interface UserInfoProps {
    userProfile: KeycloakProfile;
}

function UserInfo({userProfile}: UserInfoProps) {
    const text: React.ReactNode[] = [];
    if (userProfile.username) {
        text.push(<b>userProfile.username</b>);
    }
    if (userProfile.firstName) {
        if (userProfile.lastName) {
            text.push(`${userProfile.firstName} ${userProfile.lastName}`);
        } else {
            text.push(userProfile.firstName);
        }
    } else if (userProfile.lastName) {
        text.push(userProfile.lastName);
    }
    if (userProfile.email) {
        if (userProfile.emailVerified) {
            text.push(userProfile.email);
        } else {
            text.push(`${userProfile.email} (not verified)`);
        }
    }
    return (<div>{text.map(t => <div>{t}</div>)}</div>);
}