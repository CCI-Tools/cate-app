import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import {
    closeWorkspaceInteractive,
    deleteWorkspaceInteractive,
    newWorkspaceInteractive,
    openWorkspaceInteractive,
    saveWorkspaceAsInteractive,
    saveWorkspaceInteractive
} from '../actions';
import { State } from '../state';

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IWorkspacesMenuProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IWorkspacesMenuProps {
    return {};
}

const _WorkspacesMenu = (props: IWorkspacesMenuProps & IDispatch) => {

    const handleNew = () => {
        props.dispatch(newWorkspaceInteractive());
    };

    const handleOpen = () => {
        props.dispatch(openWorkspaceInteractive() as any);
    };

    const handleClose = () => {
        props.dispatch(closeWorkspaceInteractive() as any);
    };

    const handleSave = () => {
        props.dispatch(saveWorkspaceInteractive() as any);
    };

    const handleSaveAs = () => {
        props.dispatch(saveWorkspaceAsInteractive());
    };

    const handleDelete = () => {
        props.dispatch(deleteWorkspaceInteractive() as any);
    };

    return (
        <Menu>
            <MenuItem
                text="New Workspace"
                icon="folder-new"
                onClick={handleNew}
            />
            <MenuItem
                text="Open Workspace"
                icon="folder-shared-open"
                onClick={handleOpen}
            />
            <MenuItem
                text="Close Workspace"
                icon="folder-close"
                onClick={handleClose}
            />
            <MenuDivider/>
            <MenuItem
                text="Save Workspace"
                icon="add-to-folder"
                onClick={handleSave}
            />
            <MenuItem
                text="Save Workspace As..."
                onClick={handleSaveAs}
            />
            <MenuDivider/>
            <MenuItem
                text="Delete Workspace"
                icon="trash"
                onClick={handleDelete}
            />
        </Menu>
    );
};

const WorkspacesMenu = connect(mapStateToProps)(_WorkspacesMenu);
export default WorkspacesMenu;