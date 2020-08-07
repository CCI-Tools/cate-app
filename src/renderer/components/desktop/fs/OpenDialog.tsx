import * as React from 'react';
import { FileNode } from './FileNode';

import FileDialog from './FileDialog';
import { OpenDialogOptions } from '../types';


export interface IOpenDialogProps extends OpenDialogOptions {
    isOpen?: boolean;
    onClose?: (filePaths: string[] | null) => any;
    rootNode: FileNode;
    updateFileNode: (path: string) => any;
}

const OpenDialog: React.FC<IOpenDialogProps> = (props) => {
    let openFile = true;
    let openDirectory = false;
    let multiSelections = false;
    let createDirectory = false;
    let showHiddenFiles = false;
    const properties = props.properties;
    if (properties) {
        openFile = 'openFile' in properties;
        openDirectory = 'openDirectory' in properties;
        multiSelections = 'multiSelections' in properties;
        createDirectory = 'createDirectory' in properties;
        showHiddenFiles = 'showHiddenFiles' in properties;
    }
    return (
        <FileDialog
            {...props}
            saveFile={false}
            openFile={openFile || !openDirectory}
            openDirectory={openDirectory}
            multiSelections={multiSelections}
            createDirectory={createDirectory}
            showHiddenFiles={showHiddenFiles}
        />
    );
};

export default OpenDialog;
