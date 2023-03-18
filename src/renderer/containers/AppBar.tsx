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
import FilesMenu from './FilesMenu';
import HelpMenu from './HelpMenu';


const TITLE_STYLE = {marginLeft: 10};

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppBarProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppBarProps {
    return {
    };
}


const _AppBar: React.FC<IAppBarProps & IDispatch> = (
    {
        dispatch,
    }
) => {

    const handlePreferencesClick = () => {
        dispatch(actions.showPreferencesDialog());
    };

    return (
        <Navbar>
            <NavbarGroup>
                <img src={cateIcon} width={32} height={32} alt={'Cate icon'}/>
                <h2 style={TITLE_STYLE}>Cate - ESA CCI Toolbox</h2>
            </NavbarGroup>
            <NavbarGroup align="right">
                <Popover content={<WorkspacesMenu/>} position={PopoverPosition.BOTTOM}>
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>Workspaces</Button>
                </Popover>
                <Popover content={<FilesMenu/>} position={PopoverPosition.BOTTOM}>
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>Files</Button>
                </Popover>
                <Popover content={<HelpMenu/>} position={PopoverPosition.BOTTOM}>
                    <Button className="bp3-minimal" rightIcon={'caret-down'}>Help</Button>
                </Popover>
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


