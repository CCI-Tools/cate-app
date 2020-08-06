import * as React from 'react';
import { FileSystem } from './file-system';

import FileDialog from './FileDialog';
import { SaveDialogOptions } from '../types';


export interface ISaveDialogProps extends SaveDialogOptions {
    isOpen?: boolean;
    onClose?: (filePaths: string[] | null) => any;
    fileSystem: FileSystem;
}

const SaveDialog: React.FC<ISaveDialogProps> = (props) => {
    let createDirectory = false;
    let showHiddenFiles = false;
    const properties = props.properties;
    if (properties) {
        createDirectory = 'createDirectory' in properties;
        showHiddenFiles = 'showHiddenFiles' in properties;
    }
    return (
        <FileDialog
            {...props}
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
