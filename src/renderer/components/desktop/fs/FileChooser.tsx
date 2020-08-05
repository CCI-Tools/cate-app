import * as React from 'react';
import { Breadcrumb, Breadcrumbs, Button, ButtonGroup, Classes, Colors, HTMLSelect, Label } from '@blueprintjs/core';

import { ModalDialog } from '../../ModalDialog';
import { SplitPane } from '../../SplitPane';
import { Splitter } from '../../Splitter';
import INITIAL_STATE from './data';
import { FileNode } from './file-system';
import FileTree from './FileTree';
import FileList from './FileList';
import { FileFilter, OpenDialogOptions } from '../types';


export interface IOpenDialogProps extends OpenDialogOptions {
    isOpen?: boolean;
    onClose?: (filePaths: string[] | null) => any;
}


export const OpenDialog: React.FC<IOpenDialogProps> = (
    {
        isOpen,
        onClose,
        title,
        defaultPath,
        buttonLabel,
        filters,
        properties,
    }) => {

    const [fileNodes, setFileNodes] = React.useState<FileNode[]>(INITIAL_STATE);
    const [fileTreeWidth, setFileTreeWidth] = React.useState(300);
    const [fileFilterIndex, setFileFilterIndex] = React.useState(0);
    const [selectedDirPath, setSelectedDirPath] = React.useState<string | null>(defaultPath || null);
    const [selectedPaths, setSelectedPaths] = React.useState<string[] | null>((defaultPath && [defaultPath]) || null);
    const [expandedPaths, setExpandedPaths] = React.useState<string[] | null>((defaultPath && [defaultPath]) || null);

    if (!isOpen) {
        return null;
    }

    const canConfirm = () => {
        return selectedPaths !== null;
    }

    const handleConfirm = () => {
        if (onClose) {
            // TODO
            onClose(selectedPaths);
        }
    }

    const handleCancel = () => {
        if (onClose) {
            onClose(null);
        }
    }

    const handleFileTreeWidthChange = (fileTreeWidth: number) => {
        setFileTreeWidth(fileTreeWidth);
    };

    const handleFileFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setFileFilterIndex(parseInt(event.target.value));
    };

    const handleSync = () => {
        setFileNodes(INITIAL_STATE);
    }

    return (
        <ModalDialog
            confirmTitle={buttonLabel || "Open File"}
            isOpen={isOpen}
            title={title || "Open File"}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            canConfirm={canConfirm}
            style={{width: 800, height: 600}}
        >
            <div style={{width: '100%', height: '100%', display: 'flex', flexFlow: 'column nowrap'}}>
                <div style={{flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', marginBottom: 10}}>
                    <ButtonGroup minimal={true}>
                        <Button icon="arrow-left"/>
                        <Button icon="arrow-right"/>
                        <Button icon="arrow-up"/>
                    </ButtonGroup>
                    <div style={{flexGrow: 1, backgroundColor: Colors.DARK_GRAY5, paddingLeft: 10, paddingRight: 10}}>
                        <Breadcrumbs
                            className="bp3-small bp3-minimal"
                            items={[
                                {text: 'Users'},
                                {text: 'Norman'},
                                {text: 'Desktop'},
                            ]}
                        />
                    </div>
                    <ButtonGroup minimal={true}>
                        <Button icon="caret-down"/>
                        <Button icon="refresh" onClick={handleSync}/>
                    </ButtonGroup>
                </div>
                <SplitPane dir="hor" initialSize={fileTreeWidth} onChange={handleFileTreeWidthChange}>
                    <FileTree
                        fileNodes={fileNodes}
                        selectedPath={'Dir-2/Dir-21'}
                        expandedPaths={['Dir-2']}
                    />
                    <FileList
                        fileNodes={fileNodes}
                        selectedDirPath='Dir-2/Dir-21'
                        selectedPaths={selectedPaths}
                        onSelectedPathsChange={paths => setSelectedPaths(paths)}
                        fileFilter={filters && filters.length > 0 && filters[fileFilterIndex]}
                    />
                </SplitPane>
                <div
                    style={{flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', marginTop: 10}}>
                    <span>Filename:</span>
                    <input id="filename" className={Classes.INPUT}
                           style={{flexGrow: 1, marginLeft: 10, marginRight: 5}} type="text"/>
                    <HTMLSelect
                        value={fileFilterIndex}
                        disabled={!filters || filters.length <= 1}
                        onChange={handleFileFilterChange}
                    >{
                        (filters || [{name: "All files", extensions: ["*"]}])
                            .map((f, i) =>
                                     <option value={i} key={i}>{
                                         `${f.name} (${f.extensions.map(e => "*." + e).join(", ")})`
                                     }</option>)
                    }</HTMLSelect>
                </div>
            </div>
        </ModalDialog>
    );
};
