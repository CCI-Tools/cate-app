import * as React from 'react';
import { AnchorButton, Intent } from '@blueprintjs/core';
import { connect, DispatchProp } from 'react-redux';
import { toTextValue } from '../../components/field/Field';

import { IValueEditorProps, ValueEditorCallback, ValueEditorValue } from './ValueEditor';
import * as actions from '../../actions';
import { OperationInputState, State } from '../../state';
import { TextField } from '../../components/field/TextField';
import { OpenDialogResult, SaveDialogResult } from "../../components/desktop/types";

const DIV_STYLE = {width: '20em', display: 'flex'};
const TEXT_FIELD_STYLE = {flexGrow: 1};
const BUTTON_STYLE = {flex: 'none'};


interface IFileValueEditorProps extends IValueEditorProps<string> {
}

function mapStateToProps(state: State, ownProps: IFileValueEditorProps) {
    // we only need dispatch property
    return {...ownProps};
}

// TODO (forman): complete me, i.e. validate file name

const _FileValueEditor: React.FC<IFileValueEditorProps & DispatchProp<State>> = (
    {
        input,
        value,
        onChange,
        dispatch
    }) => {

    value = (value as any) || '';

    let showFileDialogCallback;
    if (input.fileOpenMode === 'w') {
        showFileDialogCallback = (input: OperationInputState,
                                  value: ValueEditorValue<string>,
                                  onChange: ValueEditorCallback<string>) => {
            const saveDialogOptions = {
                defaultPath: toTextValue(value, undefined),
                filters: input.fileFilters,
            };
            dispatch(actions.showFileSaveDialog(saveDialogOptions, (result: SaveDialogResult) => {
                if (!result.canceled && result.filePath) {
                    onChange(input, result.filePath);
                }
            }) as any);
        }
    } else {
        showFileDialogCallback = (input: OperationInputState,
                                  value: ValueEditorValue<string>,
                                  onChange: ValueEditorCallback<string>) => {
            const properties = input.fileProps as string[];
            const openDialogOptions = {
                defaultPath: toTextValue(value, undefined),
                filters: input.fileFilters,
                properties: properties as any,
            };
            dispatch(actions.showFileOpenDialog(openDialogOptions, (result: OpenDialogResult) => {
                if (!result.canceled && result.filePaths.length > 0) {
                    // TODO (forman): file choosers: handle properties=["multiSelection", ...]
                    //   with result.filePaths.length > 0. In this case concatenate paths in a OS-compliant way,
                    //   i.e. path separator on Unix is ':', on Windows ';'
                    if (properties && properties.find(p => p === 'multiSelection')) {
                        console.error('multi-file selection is not yet implemented, returning first entry only');
                    }
                    onChange(input, result.filePaths[0]);
                }
            }) as any);
        }
    }

    return (
        <div style={DIV_STYLE}>
            <TextField style={TEXT_FIELD_STYLE}
                       value={value}
                       placeholder="Enter file path"
                       onChange={value => onChange(input, value)}
                       nullable={input.nullable}
            />
            <AnchorButton intent={Intent.PRIMARY} style={BUTTON_STYLE}
                          onClick={() => showFileDialogCallback(input, value, onChange)}>...</AnchorButton>
        </div>
    );
}

export const FileValueEditor = connect(mapStateToProps)(_FileValueEditor);
