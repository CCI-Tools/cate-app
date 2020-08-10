import * as React from 'react';
import { AnchorButton, ControlGroup, Intent } from '@blueprintjs/core';
import { connect, DispatchProp } from 'react-redux';

import { IValueEditorProps, ValueEditorCallback, ValueEditorValue } from './ValueEditor';
import * as actions from '../../actions';
import { OperationInputState, State } from '../../state';
import { TextField } from '../../components/field/TextField';
import { SaveDialogResult } from "../../components/desktop/types";

interface IFileValueEditorProps extends IValueEditorProps<string> {
}

function mapStateToProps(state: State, otherProps: IFileValueEditorProps) {
    return otherProps;
}

// TODO (forman): complete me, i.e. validate file name

class _FileValueEditor extends React.PureComponent<IFileValueEditorProps & DispatchProp<State>> {

    private static DIV_STYLE = {width: '20em', display: 'flex'};
    private static TEXT_FIELD_STYLE = {flexGrow: 1};
    private static BUTTON_STYLE = {flex: 'none'};

    render() {
        const input = this.props.input;
        const value = (this.props.value as any) || '';
        const onChange = this.props.onChange;

        let showFileDialogCallback;
        if (this.props.input.fileOpenMode === 'w') {
            showFileDialogCallback = this.showSaveDialog;
        } else {
            showFileDialogCallback = this.showOpenDialog;
        }

        return (
            <ControlGroup style={_FileValueEditor.DIV_STYLE}>
                <TextField style={_FileValueEditor.TEXT_FIELD_STYLE}
                           value={value}
                           placeholder="Enter file path"
                           onChange={value => onChange(input, value)}
                           nullable={this.props.input.nullable}
                />
                <AnchorButton intent={Intent.PRIMARY} style={_FileValueEditor.BUTTON_STYLE}
                              onClick={() => showFileDialogCallback(input, value, onChange)}>...</AnchorButton>
            </ControlGroup>
        );
    }

    showOpenDialog(input: OperationInputState,
                   value: ValueEditorValue<string>,
                   onChange: ValueEditorCallback<string>) {
        const openDialogOptions = {
            defaultPath: value as string,
            filters: input.fileFilters,
            properties: input.fileProps as any,
        };
        this.props.dispatch(actions.showSingleFileOpenDialog(openDialogOptions, (filePath: string | null) => {
            if (filePath) {
                onChange(input, filePath);
            }
        }) as any);
    }

    showSaveDialog(input: OperationInputState,
                   value: ValueEditorValue<string>,
                   onChange: ValueEditorCallback<string>) {
        const saveDialogOptions = {
            defaultPath: value as string,
            filters: input.fileFilters,
        };
        this.props.dispatch(actions.showFileSaveDialog(saveDialogOptions, (result: SaveDialogResult) => {
            if (!result.canceled && result.filePath) {
                onChange(input, result.filePath);
            }
        }) as any);
    }
}

export const FileValueEditor = connect(mapStateToProps)(_FileValueEditor);
