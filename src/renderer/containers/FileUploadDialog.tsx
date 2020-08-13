import * as React from 'react';
import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import Dropzone from 'react-dropzone';
import { CSSProperties } from "react";
import { AnchorButton, ControlGroup, Intent } from "@blueprintjs/core";
import { showDirectorySelectDialog } from "../actions";
import { TextField } from "../components/field/TextField";

const DIV_STYLE = {width: '30em', marginBottom: '2em', display: 'flex', flexGrow: 1};
const TEXT_FIELD_STYLE = {flexGrow: 1};
const BUTTON_STYLE = {flex: 'none'};

const baseStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    border: '2px dashed #137cbd',
    borderRadius: '5px',
    background: 'rgba(16, 22, 26, 0.3)',
    color: '#f5f8fa',
    // outline: 'dotted',
    transition: 'border .24s ease-in-out'
};

interface IFileUploadDialogProps {
    dialogId: string;
    isOpen: boolean;
}

interface IFileUploadDialogState extends DialogState {
    files: File[];
    dir: string;
}

function mapStateToProps(state: State): IFileUploadDialogProps {
    const dialogState = selectors.dialogStateSelector(FileUploadDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dialogId: 'fileUploadDialog'
    };
}

class FileUploadDialog extends React.Component<IFileUploadDialogProps & DispatchProp<State>, IFileUploadDialogState> {
    static readonly DIALOG_ID = 'fileUploadDialog';

    constructor(props: IFileUploadDialogProps & DispatchProp<State>) {
        super(props);
        this.state = {files: [], dir: './'};
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
    }

    componentWillReceiveProps(nextProps: IFileUploadDialogProps) {
        this.setState({files: [], dir: './'});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(FileUploadDialog.DIALOG_ID));
    }

    private canConfirm(): boolean {
        return this.state.files.length > 0;
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(FileUploadDialog.DIALOG_ID, this.state));
        for (let file of this.state.files) {
            this.props.dispatch(actions.uploadFiles(this.state.dir, file) as any);
        }
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title="Upload files"
                icon="upload"
                confirmTitle="Upload"
                confirmIconName="upload"
                confirmTooltip="Upload files."
                onCancel={this.onCancel}
                canConfirm={this.canConfirm}
                onConfirm={this.onConfirm}
                renderBody={this.renderBody}
            />);
    }

    handleOnDrop = (files: File[]) => {
        this.setState({...this.state, files: files});
    };

    handleOpenDirectoryOnClose = (dir: string) => {
        this.setState({...this.state, dir: dir});
        console.log(dir);
    };

    handleOpenDirectoryOpen = () => {
        this.props.dispatch(
            showDirectorySelectDialog({title: 'test'}, this.handleOpenDirectoryOnClose) as any);
    };

    private renderBody() {
        const files = this.state.files.map(file => (
            <li key={file.name}>
                {file.name} - {file.size} bytes
            </li>
        ));

        if (!this.state.files) {
            return null;
        }
        return (
            <div>
                <ControlGroup style={DIV_STYLE} fill={true}>
                    <TextField style={TEXT_FIELD_STYLE}
                               value={this.state.dir}
                               placeholder="Enter file path"
                               onChange={value => {
                                   console.log(value);
                               }}
                               nullable={false}
                    />
                    <AnchorButton intent={Intent.PRIMARY} style={BUTTON_STYLE}
                                  onClick={this.handleOpenDirectoryOpen}>...</AnchorButton>
                </ControlGroup>

                <ControlGroup style={DIV_STYLE} fill={true}>
                    <Dropzone onDrop={this.handleOnDrop}>
                        {({getRootProps, getInputProps}) => (
                            <section className="container">
                                <div {...getRootProps({style: baseStyle})}>
                                    <input {...getInputProps()} />
                                    <p>Drag 'n' drop some files here, or click to select files</p>
                                </div>
                                <aside>
                                    {files.length > 0 ? (<h4>Files</h4>) : ''}
                                    <ul>{files}</ul>
                                </aside>
                            </section>
                        )}
                    </Dropzone>
                </ControlGroup>
            </div>
        );
    }
}

export default connect(mapStateToProps)(FileUploadDialog);
