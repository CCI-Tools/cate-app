import * as React from 'react';
import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { Intent } from "@blueprintjs/core";
import { showMultiFileOpenDialog } from "../actions";
import { ToolButton } from "../components/ToolButton";


interface IFileDownloadDialogProps {
    dialogId: string;
    isOpen: boolean;
}

interface IFileDownloadDialogState extends DialogState {
    filePaths: string[];
}

function mapStateToProps(state: State): IFileDownloadDialogProps {
    const dialogState = selectors.dialogStateSelector(FileDownloadDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dialogId: 'fileDownloadDialog'
    };
}

class FileDownloadDialog extends React.Component<IFileDownloadDialogProps & DispatchProp<State>, IFileDownloadDialogState> {
    static readonly DIALOG_ID = 'fileDownloadDialog';

    constructor(props: IFileDownloadDialogProps & DispatchProp<State>) {
        super(props);
        this.state = {filePaths: []};
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
    }

    componentWillReceiveProps(nextProps: IFileDownloadDialogProps) {
        this.setState({filePaths: []});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(FileDownloadDialog.DIALOG_ID));
    }

    private canConfirm(): boolean {
        return this.state.filePaths.length > 0;
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(FileDownloadDialog.DIALOG_ID, this.state));
        for (let file of this.state.filePaths) {
            this.props.dispatch(actions.downloadFiles(this.state.filePaths) as any);
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
                title="Download Files"
                icon="download"
                confirmTitle="Download"
                confirmIconName="download"
                confirmTooltip="Download files."
                onCancel={this.onCancel}
                canConfirm={this.canConfirm}
                onConfirm={this.onConfirm}
                renderBody={this.renderBody}
            />);
    }

    handleOpenDirectoryOnClose = (filePaths: string[]) => {
        this.setState({...this.state, filePaths});
        console.log(filePaths);
    };

    handleOpenDirectoryOpen = () => {
        this.props.dispatch(
            showMultiFileOpenDialog({title: 'test'}, this.handleOpenDirectoryOnClose) as any);
    };

    private renderBody() {
        if (!this.state.filePaths) {
            return null;
        }

        const files = this.state.filePaths.map(file => (
            <li key={file}>
                {file}
            </li>
        ));

        return (
            <div>
                <ToolButton tooltipContent="Select files to download."
                            intent={Intent.PRIMARY}
                            onClick={this.handleOpenDirectoryOpen}
                            text="Select Files..."
                            icon="play"/>
                <aside>
                    {files.length > 0 ? (<h4>Files</h4>) : ''}
                    <ul>{files}</ul>
                </aside>
            </div>
        );
    }
}

export default connect(mapStateToProps)(FileDownloadDialog);
