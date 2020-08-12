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
    const properties = new Set(props.properties);
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
            showHiddenFiles={properties.has("showHiddenFiles")}
        />
    );
};

export default SaveDialog;
