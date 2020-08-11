import {
    Breadcrumbs,
    Button,
    ButtonGroup,
    Classes,
    Colors,
    IBreadcrumbProps,
    MenuItem,
    Tooltip
} from '@blueprintjs/core';
import { IItemRendererProps, ItemRenderer, Select } from '@blueprintjs/select';
import * as React from 'react';

import { ModalDialog } from '../../ModalDialog';
import { SplitPane } from '../../SplitPane';
import { FileDialogOptions, FileDialogResult, FileFilter } from '../types';
import FileList from './FileList';
import { addExpandedDirPath, ALL_FILES_FILTER, FileNode, getBasename, getParentDir, sanitizePath, } from './FileNode';
import FileTree from './FileTree';


const FILE_DIALOG_STYLE: React.CSSProperties = {
    width: '52vw'
};
const FILE_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%', display: 'flex', flexFlow: 'column nowrap'
};
const FILE_MGT_ROW_STYLE: React.CSSProperties = {
    flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', marginBottom: 6
};
const FILE_LIST_ROW_STYLE: React.CSSProperties = {
    height: '40vh', flexGrow: 0
};
const FILE_INPUT_ROW_STYLE: React.CSSProperties = {
    flexGrow: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginTop: 10
};
const FILE_INPUT_STYLE: React.CSSProperties = {
    flexGrow: 1, marginLeft: 10, overflow: 'hidden'
};
const FILE_NAV_ROW_STYLE: React.CSSProperties = {
    flexGrow: 0, display: 'flex', flexFlow: 'row nowrap', marginBottom: 6
};
const FILE_NAV_BC_STYLE: React.CSSProperties = {
    flexGrow: 1,
    backgroundColor: Colors.DARK_GRAY5,
    paddingLeft: 10,
    paddingRight: 10
};

interface PathState {
    selectedPaths: string[];
    expandedPaths: string[];
    selectedDirPath: string | null;
    currentDirPath: string;
    inputValue: string;
}

const FileFilterSelect = Select.ofType<FileFilter>();

export interface IFileDialogProps extends Omit<FileDialogOptions, 'properties'> {
    isOpen?: boolean;
    onClose?: (result: FileDialogResult) => any;
    rootNode: FileNode;
    updateFileNode: (path: string, force: boolean) => any;
    createFileNode?: (path: string, name: string) => any;
    renameFileNode?: (path: string, name: string) => any;
    deleteFileNodes?: (paths: string[]) => any;
    // dialog type
    saveFile?: boolean;
    // from properties
    openFile?: boolean;
    openDirectory?: boolean;
    multiSelections?: boolean;
    showHiddenFiles?: boolean;
}

const FileDialog: React.FC<IFileDialogProps> = (
    {
        isOpen,
        onClose,
        rootNode,
        updateFileNode,
        createFileNode,
        renameFileNode,
        deleteFileNodes,
        title,
        defaultPath,
        buttonLabel,
        filters,
        saveFile,
        openFile,
        openDirectory,
        multiSelections,
        showHiddenFiles,
    }) => {

    if ((saveFile && openFile) || (saveFile && openDirectory) || (saveFile && multiSelections)) {
        throw new Error('saveFile flag cannot be used with openFile, openDirectory, multiSelections flags');
    }
    if (showHiddenFiles) {
        // TODO (forman): recognize showHiddenFiles
        console.warn('showHiddenFiles flag ignored (not implemented yet))');
    }

    const defaultDirPath = (defaultPath && getParentDir(defaultPath)) || null;
    const initialPathState: PathState = {
        selectedPaths: (defaultPath && [defaultPath]) || [],
        expandedPaths: (defaultDirPath && [defaultDirPath]) || [],
        selectedDirPath: defaultDirPath,
        currentDirPath: defaultDirPath || '',
        inputValue: '',
    };
    const [pathState, dispatchPathState] = React.useReducer(
        (state: PathState, stateUpdate: Partial<PathState>) => {
            return {...state, ...stateUpdate}
        },
        initialPathState);

    const [fileTreeWidth, setFileTreeWidth] = React.useState(300);
    const [selectedFileFilter, setSelectedFileFilter] = React.useState(
        filters && filters.length ? filters[0] : null
    );

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

    const canNavigateBack = () => {
        // TODO (forman): implement me!
        return false;
    };

    const handleNavigateBack = () => {
        if (canNavigateBack()) {
            // TODO (forman): implement me!
        }
    };

    const canNavigateForward = () => {
        return false;
    };

    const handleNavigateForward = () => {
        if (canNavigateForward()) {
            // TODO (forman): implement me!
        }
    };

    const canNavigateUp = () => {
        return pathState.currentDirPath !== '';
    };

    const handleNavigateUp = () => {
        if (canNavigateUp()) {
            const parentDir = getParentDir(pathState.currentDirPath);
            dispatchPathState({
                                  selectedDirPath: parentDir !== '' ? parentDir : null,
                                  currentDirPath: parentDir,
                              });
        }
    };

    const canShowRecentDirs = () => {
        // TODO (forman): implement me!
        return false;
    };

    const handleShowRecentDirs = () => {
        if (canShowRecentDirs()) {
            // TODO (forman): implement me!
        }
    };

    const canShowRecentPaths = () => {
        // TODO (forman): implement me!
        return false;
    };

    const handleShowRecentPaths = () => {
        if (canShowRecentPaths()) {
            // TODO (forman): implement me!
        }
    };

    const canCreateDirectory = () => {
        return Boolean(createFileNode);
    };

    const handleCreateDirectoryClick = () => {
        if (canCreateDirectory()) {
            // TODO (forman): enter create mode
            // createFileNode!(pathState.selectedDirPath!, name);
        }
    };

    const canRename = () => {
        return Boolean(renameFileNode) && pathState.selectedPaths.length === 1;
    };

    const handleRenameClick = () => {
        if (canRename()) {
            // TODO (forman): enter rename mode
            // renameFileNode!(pathState.selectedPaths[0], name);
        }
    };

    const canDelete = () => {
        return Boolean(deleteFileNodes) && pathState.selectedPaths.length > 0;
    };

    const handleDeleteClick = () => {
        if (canDelete()) {
            deleteFileNodes!(pathState.selectedPaths);
        }
    };

    const handleSyncCurrentDir = () => {
        updateFileNode(pathState.currentDirPath, true);
    };

    const handleSelectedDirChangeInBreadcrumb = (path: string) => {
        handleSelectedDirChangeInTree(path);
    };

    const handleSelectedDirChangeInTree = (path: string | null) => {
        if (openDirectory) {
            // change selectedPaths/inputValue too
            if (path !== null) {
                const selectedPaths = [path];
                const inputValue = toPathInputValue([getBasename(path)], multiSelections);
                dispatchPathState({
                                      selectedDirPath: path,
                                      currentDirPath: path,
                                      selectedPaths,
                                      inputValue
                                  });
            } else {
                dispatchPathState({
                                      selectedDirPath: null,
                                      selectedPaths: [],
                                      inputValue: ''
                                  });
            }
        } else {
            // do not change selectedPaths/inputValue
            if (path !== null) {
                dispatchPathState({
                                      selectedDirPath: path,
                                      currentDirPath: path
                                  });
            } else {
                dispatchPathState({selectedDirPath: null});
            }
        }
    };

    const handleExpandedPathsChangeInTree = (paths: string[]) => {
        dispatchPathState({expandedPaths: paths});
    };

    const handleSelectedPathsChangeInList = (paths: string[]) => {
        dispatchPathState({
                              selectedPaths: paths,
                              inputValue: toPathInputValue(paths.map(p => getBasename(p)), multiSelections)
                          });
    };

    const handleCurrentDirPathChangeInList = (path: string) => {
        if (openDirectory && !openFile && !multiSelections) {
            // change selectedPaths/inputValue too
            dispatchPathState({
                                  expandedPaths: addExpandedDirPath(pathState.expandedPaths, path),
                                  selectedDirPath: path,
                                  currentDirPath: path,
                                  selectedPaths: [path],
                                  inputValue: toPathInputValue([getBasename(path)], multiSelections),
                              });
        } else {
            dispatchPathState({
                                  expandedPaths: addExpandedDirPath(pathState.expandedPaths, path),
                                  selectedDirPath: path,
                                  currentDirPath: path,
                              });
        }
    };

    const handleSelectedPathsChangeInTextField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value || '';
        dispatchPathState({
                              selectedPaths: fromPathInputValue(inputValue, multiSelections).map(v => pathState.currentDirPath !== '' ? pathState.currentDirPath + '/' + v : v),
                              inputValue: event.target.value
                          });
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
            title={title || getDefaultFileActionText(saveFile, openDirectory, openFile)}
            confirmTitle={buttonLabel || getDefaultFileActionText(saveFile, openDirectory, openFile)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            canConfirm={canConfirm}
            style={FILE_DIALOG_STYLE}
        >
            <div style={FILE_CONTAINER_STYLE}>
                <div style={FILE_NAV_ROW_STYLE}>
                    <ButtonGroup minimal={true}>
                        <Button
                            disabled={!canNavigateBack()}
                            onClick={handleNavigateBack}
                            icon="arrow-left"
                        />
                        <Button
                            disabled={!canNavigateForward()}
                            onClick={handleNavigateForward}
                            icon="arrow-right"
                        />
                        <Button
                            disabled={!canNavigateUp()}
                            onClick={handleNavigateUp}
                            icon="arrow-up"
                        />
                    </ButtonGroup>
                    <div style={FILE_NAV_BC_STYLE}>
                        <Breadcrumbs className="bp3-small" items={getBreadcrumbs()}/>
                    </div>
                    <ButtonGroup minimal={true}>
                        <Button
                            disabled={!canShowRecentDirs()}
                            onClick={handleShowRecentDirs}
                            icon="caret-down"
                        />
                        <Button
                            onClick={handleSyncCurrentDir}
                            icon="refresh"
                        />
                    </ButtonGroup>
                </div>
                {(Boolean(createFileNode) || Boolean(renameFileNode) || Boolean(deleteFileNodes)) && (
                    <div style={FILE_MGT_ROW_STYLE}>
                        <ButtonGroup minimal={true}>
                            {Boolean(createFileNode) && (
                                <Tooltip
                                    content={canCreateDirectory()
                                             ? `Create new directory in ${pathState.currentDirPath}` : null}>
                                    <Button
                                        disabled={!canCreateDirectory()}
                                        onClick={handleCreateDirectoryClick}
                                        icon="folder-new"
                                        text="Create Directory"
                                    />
                                </Tooltip>
                            )}
                            {Boolean(renameFileNode) && (
                                <Tooltip content={canRename() ? `Rename ${pathState.selectedPaths[0]}` : null}>
                                    <Button
                                        disabled={!canRename()}
                                        onClick={handleRenameClick}
                                        icon="edit"
                                        text="Rename"
                                    />
                                </Tooltip>
                            )}
                            {Boolean(deleteFileNodes) && (
                                <Tooltip content={canDelete()
                                                  ? `Delete ${pathState.selectedPaths[0]}`
                                                    + (pathState.selectedPaths.length > 0 ? ', ...' : '') : null}>
                                    <Button
                                        disabled={!canDelete()}
                                        onClick={handleDeleteClick}
                                        icon="trash"
                                        text="Delete Directory"
                                    />
                                </Tooltip>
                            )}
                        </ButtonGroup>
                    </div>)}
                <div style={FILE_LIST_ROW_STYLE}>
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
                <div style={FILE_INPUT_ROW_STYLE}>
                    <span>{openDirectory && !openFile ? 'Directory:' : 'Filename:'}</span>
                    <input
                        className={Classes.INPUT}
                        style={FILE_INPUT_STYLE}
                        type="text"
                        value={pathState.inputValue}
                        onChange={handleSelectedPathsChangeInTextField}
                    />
                    <ButtonGroup>
                        <Button
                            disabled={!canShowRecentPaths()}
                            onClick={handleShowRecentPaths}
                            icon="caret-down"
                            minimal={true}
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
                                 text={getFileFilterText(selectedFileFilter)}
                                 rightIcon="caret-down"
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

function getFileFilterText(fileFilter: FileFilter | null): string {
    fileFilter = fileFilter || ALL_FILES_FILTER;
    return `${fileFilter.name} (${fileFilter.extensions.map(e => "*." + e).join(", ")})`;
}

function getDefaultFileActionText(saveFile?: boolean, openDirectory?: boolean, openFile?: boolean): string {
    if (saveFile) {
        return 'Save File';
    }
    if (openDirectory && !openFile) {
        return 'Select Directory';
    }
    return 'Open File';
}

function fromPathInputValue(inputValue: string, multiSelection: boolean): string[] {
    inputValue = inputValue.trim()
    if (!multiSelection) {
        if (inputValue === '') {
            return [];
        }
        return [inputValue];
    }
    const paths = [];
    let escC = null;
    let p = '';
    for (let i = 0; i < inputValue.length; i++) {
        const c = inputValue[i];
        if (c === '"' || c === "'") {
            if (escC === null) {
                escC = c;
                p = '';
            } else if (escC === c) {
                escC = null;
            }
        } else if (c === ' ') {
            if (escC === null) {
                if (p !== '') {
                    paths.push(p);
                    p = '';
                }
            } else {
                p += c;
            }
        } else {
            p += c;
        }
    }
    if (p !== '') {
        paths.push(p);
    }
    return paths;
}

function toPathInputValue(paths: string[], multiSelection: boolean): string {
    if (!multiSelection) {
        if (paths.length === 0) {
            return '';
        }
        return paths[0].trim();
    }
    return paths.map(p => escapePath(p.trim())).join(' ');
}

function escapePath(path: string): string {
    if (path.indexOf(' ') >= 0) {
        if (path.indexOf('"') >= 0) {
            return `'${path}'`;
        } else {
            return `"${path}"`;
        }
    }
    return path;
}
