import * as React from 'react';
import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import Dropzone from 'react-dropzone';
import { CSSProperties } from "react";
import { Intent } from "@blueprintjs/core";
import { showDirectorySelectDialog } from "../actions";
import { ToolButton } from "../components/ToolButton";


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
                <ToolButton tooltipContent="Select directory to upload to."
                            intent={Intent.PRIMARY}
                            onClick={this.handleOpenDirectoryOpen}
                            text="Select Directory..."
                            icon="play"/>

                {this.state.dir ? (<ul><li>Dir: {this.state.dir}</li></ul>) : ''}

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
