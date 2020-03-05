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

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppBarProps {
    canLogout: boolean;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppBarProps {
    return {
        canLogout: state.communication.user !== null && state.communication.token !== null,
    };
}

class _AppBar extends React.PureComponent<IAppBarProps & IDispatch, null> {

    handlePreferencesClick = () => {
        this.props.dispatch(actions.showPreferencesDialog());
    };

    handleLogoutClick = () => {
        this.props.dispatch(actions.logout() as any);
    };

    // TODO (forman): implement drop down menus
    render() {
        return (
            <Navbar>
                <NavbarGroup>
                    <img src={cateIcon} width={32} height={32} alt={'Cate icon'}/>
                    <h3 style={{marginLeft: 10}}>Cate - ESA CCI Toolbox</h3>
                </NavbarGroup>
                <NavbarGroup align="right">
                    <Popover content={<WorkspacesMenu/>} position={PopoverPosition.BOTTOM}>
                        <Button className="bp3-minimal">Workspaces</Button>
                    </Popover>
                    <NavbarDivider/>
                    <Button className="bp3-minimal"
                            icon="log-out"
                            onClick={this.handleLogoutClick}
                            disabled={!this.props.canLogout}>Logout</Button>
                    <NavbarDivider/>
                    <Button className="bp3-minimal"
                            icon='cog'
                            onClick={this.handlePreferencesClick}/>
                </NavbarGroup>
            </Navbar>
        );
    }
}

const AppBar = connect(mapStateToProps)(_AppBar);
export default AppBar;
