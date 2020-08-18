import * as React from 'react';
import { AnchorButton, ControlGroup, Intent } from "@blueprintjs/core";
import { connect, DispatchProp } from 'react-redux';

import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import { AnchorButton, ControlGroup, Intent } from "@blueprintjs/core";

import * as actions from '../actions';
import * as selectors from '../selectors';
import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { showFileOpenDialog } from "../actions";
import { OpenDialogResult } from "../components/desktop/types";


const DIV_STYLE = {width: '100%', marginBottom: '2em', display: 'flex', flexGrow: 1};
const TEXT_FIELD_STYLE = {flexGrow: 1};
const DIV_STYLE = {width: '100%', marginBottom: '2em', display: 'flex', flexGrow: 1};
const BUTTON_STYLE = {flex: 'none'};


interface IFileDownloadDialogProps {
    dialogId: string;
    isOpen: boolean;
}

interface IFileDownloadDialogState extends DialogState {
    filePaths?: string[];
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
        this.props.dispatch(actions.downloadFiles(this.state.filePaths) as any);
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

    handleOpenFilesOnClose = (result: OpenDialogResult) => {
        if (!result.canceled) {
            this.setState({...this.state, filePaths: result.filePaths});
        }
    };

    handleOpenFilesOpen = () => {
        this.props.dispatch(
            showFileOpenDialog({
                                   title: 'Select Files',
                                   properties: ['openFile', 'multiSelections']
                               },

                               this.handleOpenFilesOnClose) as any);
    };

    private renderBody() {
        if (!this.state.filePaths) {
            return null;
        }
        const files = this.state.filePaths.map(path => (
            <li key={path}>
                {path}
            </li>
        ));

        return (
            <div>
                File download:
                <ControlGroup style={DIV_STYLE} fill={true}>
                    <AnchorButton intent={Intent.PRIMARY} style={BUTTON_STYLE}
                                  onClick={this.handleOpenFilesOpen}>Select Remote Files...</AnchorButton>

                </ControlGroup>
                <aside>
                    {files.length > 0 ? (<h4>Files</h4>) : ''}
                    <ul>{files}</ul>
                </aside>

            </div>
        );
    }
}

export default connect(mapStateToProps)(FileDownloadDialog);
