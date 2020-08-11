import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { State } from '../state';
import { fileDownloadInteractive, fileUploadInteractive, showMultiFileOpenDialog } from "../actions";


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IFilesMenuProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IFilesMenuProps {
    return {};
}

const _FilesMenu: React.FC<IFilesMenuProps & IDispatch> = (props) => {
    const handleUploadFiles = () => {
        props.dispatch(fileUploadInteractive());
    };

    const handleDownloadFiles = () => {
        props.dispatch(fileDownloadInteractive());
    };

    const handleBrowseFiles = () => {
        props.dispatch(showMultiFileOpenDialog({title: 'Browse'},  () => {}) as any);
    };

    return (
        <div>
            <Menu>
                <MenuItem
                    text="Upload Files"
                    icon="upload"
                    onClick={handleUploadFiles}
                />
                <MenuDivider/>
                <MenuItem
                    text="Download Files"
                    icon="download"
                    onClick={handleDownloadFiles}
                />
                <MenuDivider/>
                <MenuItem
                    text="Browse Files"
                    icon="folder-close"
                    onClick={handleBrowseFiles}
                />
            </Menu>
        </div>
    );
};

const FilesMenu = connect(mapStateToProps)(_FilesMenu);
export default FilesMenu;
