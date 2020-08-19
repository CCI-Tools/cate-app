import * as React from 'react';
import { OpenDialogOptions, OpenDialogResult } from '../types';

import FileDialog from './FileDialog';
import { FileNode } from './FileNode';


export interface IOpenDialogProps extends OpenDialogOptions {
    isOpen?: boolean;
    onClose?: (result: OpenDialogResult) => any;
    rootNode: FileNode;
    updateFileNode: (path: string, force: boolean) => any;
}

const OpenDialog: React.FC<IOpenDialogProps> = (props) => {
    const properties = new Set(props.properties);
    return (
        <FileDialog
            {...props}
            saveFile={false}
            // openFile={properties.has('openFile') || !properties.has('openDirectory')}
            openFile={properties.has('openFile')}
            openDirectory={properties.has('openDirectory')}
            multiSelections={properties.has('multiSelections')}
            showHiddenFiles={properties.has('showHiddenFiles')}
        />
    );
};

export default OpenDialog;
