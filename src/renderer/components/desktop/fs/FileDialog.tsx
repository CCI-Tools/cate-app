import * as React from 'react';
import {
    Breadcrumbs,
    Button,
    ButtonGroup,
    Classes,
    Colors,
    IBreadcrumbProps,
    MenuItem
} from '@blueprintjs/core';
import {
    ItemRenderer,
    Select,
    IItemRendererProps
} from '@blueprintjs/select';

import { ModalDialog } from '../../ModalDialog';
import { SplitPane } from '../../SplitPane';
import { ALL_FILES_FILTER, FileNode, FileSystem, getFileNode, getParentDir } from './file-system';
import FileTree from './FileTree';
import FileList from './FileList';
import { FileDialogOptions, FileFilter } from '../types';


const FileFilterSelect = Select.ofType<FileFilter>();

export interface IFileDialogProps extends Omit<FileDialogOptions, 'properties'> {
    isOpen?: boolean;
    onClose?: (filePaths: string[] | null) => any;
    rootNode: FileNode,
    fileSystem: FileSystem;
    saveFile?: boolean;
    // from properties
    openFile?: boolean;
    openDirectory?: boolean;
    multiSelections?: boolean;
    createDirectory?: boolean,
    showHiddenFiles?: boolean;
}


const FileDialog: React.FC<IFileDialogProps> = (
    {
        isOpen,
        onClose,
        rootNode,
        fileSystem,
        title,
        defaultPath,
        buttonLabel,
        filters,
        saveFile,
        openFile,
        openDirectory,
        multiSelections,
        createDirectory,
        showHiddenFiles,
    }) => {

    if ((saveFile && openFile) || (saveFile && openDirectory) || (saveFile && multiSelections)) {
        throw new Error('saveFile flag cannot be used with openFile, openDirectory, multiSelections flags');
    }
    if (openDirectory) {
        // TODO (forman): recognize openDirectory
        console.warn('openDirectory flag ignored (not implemented yet))');
    }
    if (createDirectory) {
        // TODO (forman): recognize createDirectory
        console.warn('createDirectory flag ignored (not implemented yet))');
    }
    if (showHiddenFiles) {
        // TODO (forman): recognize showHiddenFiles
        console.warn('showHiddenFiles flag ignored (not implemented yet))');
    }

    filters = filters || [ALL_FILES_FILTER];
    const parentDirPath = defaultPath && getParentDir(defaultPath);

    const [fileTreeWidth, setFileTreeWidth] = React.useState(300);
    const [selectedFileFilter, setSelectedFileFilter] = React.useState(filters[0]);
    const [selectedDirPath, setSelectedDirPath] = React.useState<string | null>(parentDirPath || null);
    const [selectedPaths, setSelectedPaths] = React.useState<string[]>((defaultPath && [defaultPath]) || []);
    const [expandedPaths, setExpandedPaths] = React.useState<string[]>((parentDirPath && [parentDirPath]) || []);

    React.useEffect(() => {
        if (!rootNode.childNodes && !rootNode.status) {
            fileSystem.updateNode();
        }
    });

    React.useEffect(() => {
        if (rootNode.childNodes && selectedDirPath) {
            const node = getFileNode(rootNode, selectedDirPath)
            if (!node.childNodes && !rootNode.status) {
                fileSystem.updateNode(selectedDirPath);
            }
        }
    }, [selectedDirPath]);

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

    const handleSyncSelectedDir = () => {
        fileSystem.updateNode(selectedDirPath ? selectedDirPath : undefined);
    };

    const getBreadcrumbs = (): IBreadcrumbProps[] => {
        if (!selectedDirPath || selectedDirPath === '') {
            return [];
        }
        let pathComponents = selectedDirPath.split('/');
        return pathComponents.map((dirName, index) => {
            let onClick;
            if (index < pathComponents.length - 1) {
                // TODO (forman): onClick must also add to expanded paths
                onClick = () => setSelectedDirPath(pathComponents.slice(0, index + 1).join('/'));
            }
            return {text: dirName, onClick};
        });
    };

    return (
        <ModalDialog
            isOpen={isOpen}
            title={title || getDefaultFileActionText(saveFile, openDirectory)}
            confirmTitle={buttonLabel || getDefaultFileActionText(saveFile, openDirectory)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            canConfirm={canConfirm}
            style={{width: 800, height: 600}}
        >
            <div style={{width: '100%', height: '100%', display: 'flex', flexFlow: 'column nowrap'}}>
                <div style={{flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', marginBottom: 10}}>
                    <ButtonGroup minimal={true}>
                        <Button disabled={true} icon="arrow-left" onClick={handleNavigateBack}/>
                        <Button disabled={true} icon="arrow-right" onClick={handleNavigateForward}/>
                        <Button disabled={true} icon="arrow-up" onClick={handleNavigateUp}/>
                    </ButtonGroup>
                    <div style={{flexGrow: 1, backgroundColor: Colors.DARK_GRAY5, paddingLeft: 10, paddingRight: 10}}>
                        <Breadcrumbs className="bp3-small" items={getBreadcrumbs()}/>
                    </div>
                    <ButtonGroup minimal={true}>
                        <Button disabled={true} icon="caret-down" onClick={handleShowRecentDirs}/>
                        <Button icon="refresh" onClick={handleSyncSelectedDir}/>
                    </ButtonGroup>
                </div>
                <SplitPane dir="hor" initialSize={fileTreeWidth} onChange={handleFileTreeWidthChange}>
                    <FileTree
                        rootNode={rootNode}
                        selectedPath={selectedDirPath}
                        onSelectedPathChange={path => setSelectedDirPath(path)}
                        expandedPaths={expandedPaths}
                        onExpandedPathsChange={paths => setExpandedPaths(paths)}
                    />
                    <FileList
                        rootNode={rootNode}
                        selectedDirPath={selectedDirPath}
                        selectedPaths={selectedPaths}
                        onSelectedPathsChange={paths => setSelectedPaths(paths)}
                        // TODO (forman): onSelectedDirPathChange must also add to expanded paths
                        onSelectedDirPathChange={path => setSelectedDirPath(path)}
                        fileFilter={selectedFileFilter}
                        multiSelections={multiSelections}
                        openDirectory={openDirectory}
                    />
                </SplitPane>
                <div
                    style={{flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', marginTop: 10}}>
                    <span>Filename:</span>
                    <input
                        className={Classes.INPUT}
                        style={{flexGrow: 1, marginLeft: 10, overflow: 'hidden'}}
                        type="text"
                        value={toFileInputText(selectedDirPath, selectedPaths)}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSelectedPaths(fromFileInputText(selectedDirPath, event.target.value))}
                    />
                    <ButtonGroup>
                        <Button
                            icon="caret-down"
                            onClick={handleShowRecentPaths}
                            minimal={true}
                            disabled={true}
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

export default FileDialog;

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


function toFileInputText(selectedDirPath: string | null, selectedPaths: string[]): string | null {
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

function fromFileInputText(selectedDirPath: string | null, path: string): string[] {
    while (path.indexOf('//') > 0) {
        path = path.replace('//', '/')
    }
    while (path.indexOf('\\') > 0) {
        path = path.replace('\\', '/')
    }
    if (path.startsWith('/')) {
        path = path.substring(1);
    }
    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    if (path === '') {
        return [];
    }
    return [selectedDirPath ? selectedDirPath + '/' + path : path];
}


function getFileFilterText(fileFilter: FileFilter): string {
    return `${fileFilter.name} (${fileFilter.extensions.map(e => "*." + e).join(", ")})`;
}

function getDefaultFileActionText(saveFile, openDirectory) {
    if (saveFile) {
        return 'Save File';
    }
    if (openDirectory) {
        return 'Open Directory';
    }
    return 'Open File';
}
