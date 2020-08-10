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
import {
    addExpandedDirPath, ALL_FILES_FILTER,
    FileNode,
    getParentDir,
    sanitizePath,
} from './FileNode';
import FileTree from './FileTree';
import FileList from './FileList';
import { FileDialogOptions, FileDialogResult, FileFilter } from '../types';


interface PathState {
    selectedPaths: string[];
    expandedPaths: string[];
    selectedDirPath: string | null;
    currentDirPath: string;
}

const FileFilterSelect = Select.ofType<FileFilter>();

export interface IFileDialogProps extends Omit<FileDialogOptions, 'properties'> {
    isOpen?: boolean;
    onClose?: (result: FileDialogResult) => any;
    rootNode: FileNode;
    updateFileNode: (path: string, force: boolean) => any;
    // dialog type
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
        updateFileNode,
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
    if (createDirectory) {
        // TODO (forman): recognize createDirectory
        console.warn('createDirectory flag ignored (not implemented yet))');
    }
    if (showHiddenFiles) {
        // TODO (forman): recognize showHiddenFiles
        console.warn('showHiddenFiles flag ignored (not implemented yet))');
    }

    // const [parentDirPath, defaultSelectedPath] = splitDefaultPathIntoSelectedParentDirAndPath(rootNode, defaultPath);
    const defaultDirPath = (defaultPath && getParentDir(defaultPath)) || null;

    const initialPathState: PathState = {
        selectedPaths: (defaultPath && [defaultPath]) || [],
        expandedPaths: (defaultDirPath && [defaultDirPath]) || [],
        selectedDirPath: defaultDirPath,
        currentDirPath: defaultDirPath || '',
    };
    const [pathState, dispatchPathState] = React.useReducer((state: PathState, stateUpdate: Partial<PathState>) => {
        return {...state, ...stateUpdate}
    }, initialPathState);
    const [fileTreeWidth, setFileTreeWidth] = React.useState(300);
    const [selectedFileFilter, setSelectedFileFilter] = React.useState(filters && filters.length ? filters[0] : null);

    const updateCallback = React.useMemo(() => {
        return (path: string) => {
            updateFileNode(path, false);
        };
    }, [updateFileNode]);

    React.useEffect(() => {
        if (defaultPath) {
            updateCallback(defaultPath);
        }
    }, [defaultPath, updateCallback]);

    React.useEffect(() => {
        pathState.expandedPaths.forEach(p => updateCallback(p));
    }, [pathState.expandedPaths, updateCallback]);

    React.useEffect(() => {
        updateCallback(pathState.currentDirPath);
    }, [pathState.currentDirPath, updateCallback]);

    if (!isOpen) {
        return null;
    }

    // console.log("FileDialog: pathState=", pathState);

    const canConfirm = () => {
        return pathState.selectedPaths.length > 0;
    }

    const handleConfirm = () => {
        if (onClose) {
            onClose({filePaths: pathState.selectedPaths, canceled: false});
        }
    }

    const handleCancel = () => {
        if (onClose) {
            onClose({filePaths: [], canceled: true});
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

    const handleSyncCurrentDir = () => {
        updateFileNode(pathState.currentDirPath, true);
    };

    const handleSelectedDirChangeInBreadcrumb = (path: string) => {
        dispatchPathState({selectedDirPath: path, currentDirPath: path});
    };

    const handleSelectedDirChangeInTree = (path: string | null) => {
        if (openDirectory) {
            if (path !== null) {
                dispatchPathState({selectedPaths: [path], selectedDirPath: path, currentDirPath: path});
            } else {
                dispatchPathState({selectedPaths: [], selectedDirPath: null});
            }
        } else {
            if (path !== null) {
                dispatchPathState({selectedDirPath: path, currentDirPath: path});
            } else {
                dispatchPathState({selectedDirPath: null});
            }
        }
    };

    const handleExpandedPathsChangeInTree = (paths: string[]) => {
        dispatchPathState({expandedPaths: paths});
    };

    const handleSelectedPathsChangeInList = (paths: string[]) => {
        dispatchPathState({selectedPaths: paths});
    };

    const handleCurrentDirPathChangeInList = (path: string) => {
        dispatchPathState({
                              expandedPaths: addExpandedDirPath(pathState.expandedPaths, path),
                              selectedDirPath: path,
                              currentDirPath: path,
                          });
    };

    const handleSelectedPathsChangeInTextField = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatchPathState({selectedPaths: fromFileInputText(pathState.currentDirPath, event.target.value)})
    }

    const getBreadcrumbs = (): IBreadcrumbProps[] => {
        if (pathState.currentDirPath === '') {
            return [];
        }
        let pathComponents = pathState.currentDirPath.split('/');
        return pathComponents.map((dirName, index) => {
            let onClick;
            if (index < pathComponents.length - 1) {
                const path = pathComponents.slice(0, index + 1).join('/');
                onClick = () => handleSelectedDirChangeInBreadcrumb(path);
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
            style={{width: 800}}
        >
            <div style={{width: '100%', display: 'flex', flexFlow: 'column nowrap'}}>
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
                        <Button icon="refresh" onClick={handleSyncCurrentDir}/>
                    </ButtonGroup>
                </div>
                <div style={{height: 320, flexGrow: 0}}>
                    <SplitPane dir="hor" initialSize={fileTreeWidth} onChange={handleFileTreeWidthChange}>
                        <FileTree
                            rootNode={rootNode}
                            selectedPath={pathState.selectedDirPath}
                            onSelectedPathChange={handleSelectedDirChangeInTree}
                            expandedPaths={pathState.expandedPaths}
                            onExpandedPathsChange={handleExpandedPathsChangeInTree}
                        />
                        <FileList
                            rootNode={rootNode}
                            currentDirPath={pathState.currentDirPath}
                            onCurrentDirPathChange={handleCurrentDirPathChangeInList}
                            selectedPaths={pathState.selectedPaths}
                            onSelectedPathsChange={handleSelectedPathsChangeInList}
                            fileFilter={selectedFileFilter}
                            multiSelections={multiSelections}
                            openDirectory={openDirectory}
                        />
                    </SplitPane>
                </div>
                <div
                    style={{flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', marginTop: 10}}
                >
                    <span>Filename:</span>
                    <input
                        className={Classes.INPUT}
                        style={{flexGrow: 1, marginLeft: 10, overflow: 'hidden'}}
                        type="text"
                        value={toFileInputText(pathState.currentDirPath, pathState.selectedPaths)}
                        onChange={handleSelectedPathsChangeInTextField}
                    />
                    <ButtonGroup>
                        <Button
                            icon="caret-down"
                            onClick={handleShowRecentPaths}
                            minimal={true}
                            disabled={true}
                        />
                        {filters &&
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
                        }
                    </ButtonGroup>
                </div>
            </div>
        </ModalDialog>
    );
};

export default FileDialog;

const fileFilterItemRenderer: ItemRenderer<FileFilter> = (fileFilter: FileFilter, itemProps: IItemRendererProps) => {
    const {modifiers, handleClick} = itemProps;
    return (
        <MenuItem
            active={modifiers.active}
            disabled={modifiers.disabled}
            key={fileFilter.name}
            text={fileFilter.name}
            label={`(${fileFilter.extensions.map(e => "*." + e).join(", ")})`}
            onClick={handleClick}
        />
    );
};


function toFileInputText(currentDirPath: string | null, selectedPaths: string[]): string {
    if (selectedPaths.length === 0) {
        return '';
    }
    let relPaths = selectedPaths;
    if (currentDirPath) {
        const selectedDirPath2 = currentDirPath + '/';
        relPaths = selectedPaths.map(p => p.startsWith(currentDirPath + '/') ? p.substr(selectedDirPath2.length) : p);
    }
    if (selectedPaths.length === 1) {
        return relPaths[0]
    }
    return relPaths.map(p => `"${p}"`).join(' ');
}

function fromFileInputText(currentDirPath: string, path: string): string[] {
    path = sanitizePath(path);
    if (path === '') {
        return [];
    }
    return [currentDirPath ? currentDirPath + '/' + path : path];
}


function getFileFilterText(fileFilter: FileFilter | null): string {
    fileFilter = fileFilter || ALL_FILES_FILTER;
    return `${fileFilter.name} (${fileFilter.extensions.map(e => "*." + e).join(", ")})`;
}

function getDefaultFileActionText(saveFile?: boolean, openDirectory?: boolean): string {
    if (saveFile) {
        return 'Save File';
    }
    if (openDirectory) {
        return 'Open Directory';
    }
    return 'Open File';
}

