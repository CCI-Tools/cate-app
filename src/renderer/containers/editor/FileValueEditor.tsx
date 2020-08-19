import * as React from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Button, Intent, ControlGroup } from '@blueprintjs/core';

import { HostOS, makeAbsolutePath, makeRelativePath } from '../../../common/paths';
import { toTextValue } from '../../components/field/Field';
import { IValueEditorProps, ValueEditorCallback, ValueEditorValue } from './ValueEditor';
import * as actions from '../../actions';
import { OperationInputState, State } from '../../state';
import { TextField } from '../../components/field/TextField';
import { OpenDialogResult, SaveDialogResult } from "../../components/desktop/types";


const DIV_STYLE = {display: 'flex', justifySelf: 'stretch'};
const TEXT_FIELD_STYLE = {flexGrow: 1};
const BUTTON_STYLE = {flexGrow: 0};

interface IFileValueEditorOwnProps extends IValueEditorProps<string> {
}

interface IFileValueEditorProps extends IFileValueEditorOwnProps {
    hostOS?: HostOS;
    workspaceDir: string | null;
}

function mapStateToProps(state: State, ownProps: IFileValueEditorOwnProps): IFileValueEditorProps  {
    return {
        ...ownProps,
        hostOS: state.communication.webAPIServiceInfo.hostOS,
        workspaceDir: state.data.workspace ? state.data.workspace.baseDir : null
    };
}

// TODO (forman): complete me, i.e. validate file name

const _FileValueEditor: React.FC<IFileValueEditorProps & DispatchProp<State>> = (
    {
        input,
        value,
        onChange,
        hostOS,
        workspaceDir,
        dispatch
    }) => {

    value = (value as any) || '';

    console.log('_FileValueEditor: hostOS =', hostOS);
    console.log('_FileValueEditor: workspaceDir =', workspaceDir);

    const toRelativePath = (path: string) => {
        if (workspaceDir !== null) {
            console.log('_FileValueEditor.toRelativePath: path =', path);
            return makeRelativePath(path, workspaceDir, hostOS);
        }
        return path
    };

    const toAbsolutePath = (path: string) => {
        console.log('_FileValueEditor.toAbsolutePath: path =', path);
        if (workspaceDir !== null) {
            return makeAbsolutePath(workspaceDir, path, hostOS);
        }
        return path
    };

    let showFileDialogCallback;
    if (input.fileOpenMode === 'w') {
        showFileDialogCallback = (input: OperationInputState,
                                  value: ValueEditorValue<string>,
                                  onChange: ValueEditorCallback<string>) => {
            const saveDialogOptions = {
                defaultPath: toAbsolutePath(toTextValue(value, undefined)),
                filters: input.fileFilters,
            };
            dispatch(actions.showFileSaveDialog(saveDialogOptions, (result: SaveDialogResult) => {
                let filePath = result.filePath;
                if (!result.canceled && filePath) {
                    filePath = toRelativePath(filePath);
                    onChange(input, filePath);
                }
            }) as any);
        }
    } else {
        showFileDialogCallback = (input: OperationInputState,
                                  value: ValueEditorValue<string>,
                                  onChange: ValueEditorCallback<string>) => {
            let properties = input.fileProps as string[];
            const propsSet = new Set(properties);
            if (!propsSet.has('openFile') && !propsSet.has('openDirectory')) {
                propsSet.add('openFile');
                properties = Array.from(propsSet);
            }
            const openDialogOptions = {
                defaultPath: toAbsolutePath(toTextValue(value, undefined)),
                filters: input.fileFilters,
                properties: properties as any,
            };
            dispatch(actions.showFileOpenDialog(openDialogOptions, (result: OpenDialogResult) => {
                let filePaths = result.filePaths;
                if (!result.canceled && filePaths.length > 0) {
                    filePaths = filePaths.map(toRelativePath);
                    // TODO (forman): file choosers: handle properties=["multiSelection", ...]
                    //   with result.filePaths.length > 0. In this case concatenate paths in a OS-compliant way,
                    //   i.e. path separator on Unix is ':', on Windows ';'
                    if (properties && properties.find(p => p === 'multiSelection')) {
                        console.error('multi-file selection is not yet implemented, returning first entry only');
                    }
                    onChange(input, filePaths[0]);
                }
            }) as any);
        }
    }

    return (
        <ControlGroup fill={true} style={DIV_STYLE}>
            <TextField style={TEXT_FIELD_STYLE}
                       value={value}
                       placeholder="Enter file path"
                       onChange={value => onChange(input, value)}
                       nullable={input.nullable}
            />
            <Button intent={Intent.PRIMARY} style={BUTTON_STYLE}
                    onClick={() => showFileDialogCallback(input, value, onChange)}>...</Button>
        </ControlGroup>
    );
}

export const FileValueEditor = connect(mapStateToProps)(_FileValueEditor);
