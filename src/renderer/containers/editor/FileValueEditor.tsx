import * as React from 'react';
import { AnchorButton, ControlGroup, Intent } from '@blueprintjs/core';
import { connect, DispatchProp } from 'react-redux';

import { IValueEditorProps, ValueEditorCallback, ValueEditorValue } from './ValueEditor';
import * as actions from '../../actions';
import { OperationInputState, State } from '../../state';
import { TextField } from '../../components/field/TextField';
import { SaveDialogResult } from "../../components/desktop/types";

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
                defaultPath: value as string,
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
            const openDialogOptions = {
                defaultPath: value as string,
                filters: input.fileFilters,
                properties: input.fileProps as any,
            };
            dispatch(actions.showSingleFileOpenDialog(openDialogOptions, (filePath: string | null) => {
                if (filePath) {
                    onChange(input, filePath);
                }
            }) as any);
        }
    }

    return (
        <ControlGroup style={DIV_STYLE}>
            <TextField style={TEXT_FIELD_STYLE}
                       value={value}
                       placeholder="Enter file path"
                       onChange={value => onChange(input, value)}
                       nullable={input.nullable}
            />
            <AnchorButton intent={Intent.PRIMARY} style={BUTTON_STYLE}
                          onClick={() => showFileDialogCallback(input, value, onChange)}>...</AnchorButton>
        </ControlGroup>
    );
}

export const FileValueEditor = connect(mapStateToProps)(_FileValueEditor);
