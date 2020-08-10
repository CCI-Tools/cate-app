import * as React from 'react';
import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import Dropzone from 'react-dropzone';
import { CSSProperties } from "react";
import { Button } from "@blueprintjs/core";
import { showDirectorySelectDialog } from "../actions";


const baseStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: 20,
    borderRadius: 2,
    borderBlockColor: 'red',
    borderColor: '#eeeeee',
    borderLeftStyle: 'dashed',
    background: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out'
};

interface IFileUploadDialogProps {
    dialogId: string;
    isOpen: boolean;
}

interface IFileUploadDialogState extends DialogState {
    files: File[];
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
        this.state = {files: []};
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
    }

    componentWillReceiveProps(nextProps: IFileUploadDialogProps) {
        this.setState({files: []});
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
            this.props.dispatch(actions.uploadFiles(file) as any);
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
                title="Add file data source"
                icon="add"
                confirmTitle="Add"
                confirmIconName="add"
                confirmTooltip="Add file data source."
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
                <Button onClick={this.handleOpenDirectoryOpen}>Text</Button>
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
            </div>
        );
    }
}

export default connect(mapStateToProps)(FileUploadDialog);
