import * as React from 'react';
import { FileNode } from './FileNode';

import FileDialog from './FileDialog';
import { FileDialogResult, SaveDialogOptions, SaveDialogResult } from '../types';


export interface ISaveDialogProps extends SaveDialogOptions {
    isOpen?: boolean;
    onClose?: (result: SaveDialogResult) => any;
    rootNode: FileNode;
    updateFileNode: (path: string, force: boolean) => any;
}

const SaveDialog: React.FC<ISaveDialogProps> = ({onClose, ...props}) => {
    let createDirectory = false;
    let showHiddenFiles = false;
    const properties = props.properties;
    if (properties) {
        createDirectory = 'createDirectory' in properties;
        showHiddenFiles = 'showHiddenFiles' in properties;
    }
    const handleClose = (result: FileDialogResult) => {
        onClose({
                    canceled: result.canceled,
                    filePath: !result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null
                });
    };
    return (
        <FileDialog
            {...props}
            onClose={handleClose}
            saveFile={true}
            openFile={false}
            openDirectory={false}
            multiSelections={false}
            createDirectory={createDirectory}
            showHiddenFiles={showHiddenFiles}
        />
    );
};

export default SaveDialog;
