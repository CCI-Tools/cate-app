import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
    Button,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    Popover,
    PopoverPosition,
} from '@blueprintjs/core';
import * as actions from '../actions';
import { State } from '../state';

import cateIcon from '../resources/cate-icon-128.png';
import WorkspacesMenu from './WorkspacesMenu';


const TITLE_STYLE = {marginLeft: 10};

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppBarProps {
    canLogout: boolean;
    pwaInstallPromotionVisible: boolean;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppBarProps {
    return {
        canLogout: state.communication.user !== null && state.communication.token !== null,
        pwaInstallPromotionVisible: state.control.pwaInstallPromotionVisible,
    };
}


const _AppBar: React.FC<IAppBarProps & IDispatch> = (props) => {

    const handlePreferencesClick = () => {
        props.dispatch(actions.showPreferencesDialog());
    };

    const handleLogoutClick = () => {
        props.dispatch(actions.logout() as any);
    };

    const handleShowPwaInstallPrompt = () => {
        props.dispatch(actions.showPwaInstallPrompt() as any);
    };

    return (
        <Navbar>
            <NavbarGroup>
                <img src={cateIcon} width={32} height={32} alt={'Cate icon'}/>
                <h2 style={TITLE_STYLE}>Cate - ESA CCI Toolbox</h2>
            </NavbarGroup>
            <NavbarGroup align="right">
                {props.pwaInstallPromotionVisible && (
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
                <Popover
                    content={<WorkspacesMenu/>}
                    position={PopoverPosition.BOTTOM}
                >
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>
                        Workspaces
                    </Button>
                </Popover>
                <NavbarDivider/>
                <Button
                    className="bp3-minimal"
                    icon="log-out"
                    onClick={handleLogoutClick}
                    disabled={!props.canLogout}
                >
                    Logout
                </Button>
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
