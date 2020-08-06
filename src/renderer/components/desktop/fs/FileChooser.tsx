import { IItemRendererProps } from '@blueprintjs/select/src/common/itemRenderer';
import * as React from 'react';
import {
    Breadcrumbs,
    Button,
    ButtonGroup,
    Classes,
    Colors,
    HTMLSelect,
    IBreadcrumbProps, Icon,
    InputGroup, MenuItem
} from '@blueprintjs/core';
import { ItemRenderer, Select } from '@blueprintjs/select';

import { ModalDialog } from '../../ModalDialog';
import { SplitPane } from '../../SplitPane';
import INITIAL_STATE from './data';
import { ALL_FILES_FILTER, FileNode, getParentDir } from './file-system';
import FileTree from './FileTree';
import FileList from './FileList';
import { FileFilter, OpenDialogOptions } from '../types';

const FileFilterSelect = Select.ofType<FileFilter>();

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

    filters = filters || [ALL_FILES_FILTER];
    const parentDirPath = defaultPath && getParentDir(defaultPath);

    const [fileNodes, setFileNodes] = React.useState<FileNode[]>(INITIAL_STATE);
    const [fileTreeWidth, setFileTreeWidth] = React.useState(300);
    const [selectedFileFilter, setSelectedFileFilter] = React.useState(filters[0]);
    const [selectedDirPath, setSelectedDirPath] = React.useState<string | null>(parentDirPath || null);
    const [selectedPaths, setSelectedPaths] = React.useState<string[]>((defaultPath && [defaultPath]) || []);
    const [expandedPaths, setExpandedPaths] = React.useState<string[]>((parentDirPath && [parentDirPath]) || []);

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

    const handleNavigateBack = () => {
        // TODO (forman): implement me!
    };

    const handleNavigateForward = () => {
        // TODO (forman): implement me!
    };

    const handleNavigateUp = () => {
        // TODO (forman): implement me!
    };

    const handleShowRecentDirs = () => {
        // TODO (forman): implement me!
    };

    const handleShowRecentPaths = () => {
        // TODO (forman): implement me!
    };

    const handleShowFileFilters = () => {
        // TODO (forman): implement me!
    };

    const handleSyncSelectedDir = () => {
        // TODO (forman): implement me!
        setFileNodes(INITIAL_STATE);
    };

    const getBreadcrumbs = (): IBreadcrumbProps[] => {
        if (!selectedDirPath || selectedDirPath === '') {
            return [];
        }
        let pathComponents = selectedDirPath.split('/');
        return pathComponents.map((dirName, index) => {
            let onClick;
            if (index < pathComponents.length - 1) {
                onClick = () => setSelectedDirPath(pathComponents.slice(0, index + 1).join('/'));
            }
            return {text: dirName, onClick};
        });
    };

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
                        <Button icon="arrow-left" onClick={handleNavigateBack}/>
                        <Button icon="arrow-right" onClick={handleNavigateForward}/>
                        <Button icon="arrow-up" onClick={handleNavigateUp}/>
                    </ButtonGroup>
                    <div style={{flexGrow: 1, backgroundColor: Colors.DARK_GRAY5, paddingLeft: 10, paddingRight: 10}}>
                        <Breadcrumbs className="bp3-small" items={getBreadcrumbs()}/>
                    </div>
                    <ButtonGroup minimal={true}>
                        <Button icon="caret-down" onClick={handleShowRecentDirs}/>
                        <Button icon="refresh" onClick={handleSyncSelectedDir}/>
                    </ButtonGroup>
                </div>
                <SplitPane dir="hor" initialSize={fileTreeWidth} onChange={handleFileTreeWidthChange}>
                    <FileTree
                        fileNodes={fileNodes}
                        selectedPath={selectedDirPath}
                        onSelectedPathChange={path => setSelectedDirPath(path)}
                        expandedPaths={expandedPaths}
                        onExpandedPathsChange={paths => setExpandedPaths(paths)}
                    />
                    <FileList
                        fileNodes={fileNodes}
                        selectedDirPath={selectedDirPath}
                        selectedPaths={selectedPaths}
                        onSelectedPathsChange={paths => setSelectedPaths(paths)}
                        fileFilter={selectedFileFilter}
                    />
                </SplitPane>
                <div
                    style={{flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', marginTop: 10}}>
                    <span>Filename:</span>
                    <input
                        className={Classes.INPUT}
                        style={{flexGrow: 1, marginLeft: 10, overflow: 'hidden'}}
                        type="text"
                        value={getFileInputText(selectedDirPath, selectedPaths)}
                    />
                    <ButtonGroup>
                        <Button
                            icon="caret-down"
                            onClick={handleShowRecentPaths}
                            minimal={true}
                        />
                        <FileFilterSelect
                            popoverProps={{minimal: true}}
                            items={filters}
                            filterable={false}
                            itemRenderer={fileFilterItemRenderer}
                            onItemSelect={filter => setSelectedFileFilter(filter)}
                        >
                            <Button
                                rightIcon="caret-down"
                                text={getFileFilterText(selectedFileFilter)}
                            />
                        </FileFilterSelect>
                    </ButtonGroup>
                </div>
            </div>
        </ModalDialog>
    );
};

const fileFilterItemRenderer: ItemRenderer<FileFilter> = (fileFilter: FileFilter, itemProps: IItemRendererProps) => {
    const {modifiers, handleClick} = itemProps;
    const text = getFileFilterText(fileFilter);
    return (
        <MenuItem
            active={modifiers.active}
            disabled={modifiers.disabled}
            label={text}
            key={fileFilter.name}
            onClick={handleClick}
            text={text}
        />
    );
};


function getFileInputText(selectedDirPath: string, selectedPaths: string[]): string | null {
    if (selectedPaths.length === 0) {
        return null;
    }
    let relPaths = selectedPaths;
    if (selectedDirPath) {
        const selectedDirPath2 = selectedDirPath + '/';
        relPaths = selectedPaths.map(p => p.startsWith(selectedDirPath + '/') ? p.substr(selectedDirPath2.length) : p);
    }
    if (selectedPaths.length === 1) {
        return relPaths[0]
    }
    return relPaths.map(p => `"${p}"`).join(' ');
}


function getFileFilterText(fileFilter: FileFilter): string {
    return `${fileFilter.name} (${fileFilter.extensions.map(e => "*." + e).join(", ")})`;
}
