import * as React from 'react';
import { AnchorButton, ControlGroup, InputGroup, Intent } from '@blueprintjs/core';
import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { OpenDialogProperty } from "../components/desktop/types";

interface ISelectWorkspaceDialogState extends DialogState {
    workspaceDir: string | null;
    workspaceName: string;
}

interface ISelectWorkspaceDialogOwnProps {
    dialogId: string;
}

interface ISelectWorkspaceDialogProps extends ISelectWorkspaceDialogState, ISelectWorkspaceDialogOwnProps {
    isOpen: boolean;
    isNewDialog: boolean;
    isLocalFSAllowed: boolean;
}

function mapStateToProps(state: State, ownProps: ISelectWorkspaceDialogOwnProps): ISelectWorkspaceDialogProps {
    const dialogState = selectors.dialogStateSelector(ownProps.dialogId)(state) as any;
    const isOpen = dialogState.isOpen;
    const dialogId = ownProps.dialogId;
    const isNewDialog = ownProps.dialogId === 'newWorkspaceDialog';
    const isLocalFSAllowed = selectors.isLocalFSAccessAllowedSelector(state);
    let workspaceDir = dialogState.workspaceDir;
    let workspaceName = dialogState.workspaceName;
    // TODO (forman): Fix code duplication with ChooseWorkspaceDialog
    if (isOpen) {
        if (!selectors.isScratchWorkspaceSelector(state)) {
            workspaceDir = workspaceDir || selectors.workspaceDirSelector(state);
            workspaceName = workspaceName || selectors.workspaceNameSelector(state);
        }
        workspaceDir = workspaceDir || selectors.lastWorkspaceDirSelector(state);
    }
    workspaceDir = isLocalFSAllowed ? workspaceDir || '' : null;
    workspaceName = workspaceName || '';
    return {
        workspaceDir,
        workspaceName,
        dialogId,
        isNewDialog,
        isOpen,
        isLocalFSAllowed,
    };
}

// TODO (forman): Rename to (Get)WorkspaceNameDialog
class SelectWorkspaceDialog extends React.Component<ISelectWorkspaceDialogProps & ISelectWorkspaceDialogOwnProps & DispatchProp<State>, ISelectWorkspaceDialogState> {

    // TODO (forman): Remove member
    private localWebAPI: boolean;

    constructor(props: ISelectWorkspaceDialogProps & DispatchProp<State>) {
        super(props);
        this.state = {workspaceDir: '', workspaceName: ''};
        // TODO (forman): Fix code duplication with ChooseWorkspaceDialog
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onWorkspaceNameChange = this.onWorkspaceNameChange.bind(this);
        this.onWorkspaceDirChange = this.onWorkspaceDirChange.bind(this);
        this.showSelectDirectoryDialog = this.showSelectDirectoryDialog.bind(this);
        this.localWebAPI = props.isLocalFSAllowed;
    }

    componentWillReceiveProps(nextProps: ISelectWorkspaceDialogProps) {
        this.setState({workspaceDir: nextProps.workspaceDir, workspaceName: nextProps.workspaceName});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(this.props.dialogId));
    }

    private canConfirm(): boolean {
        // TODO (SabineEmbacher) validate against existing workspace names
        if ((this.localWebAPI && !this.state.workspaceDir) || !this.state.workspaceName) {
            return false;
        }
        return /^([A-Za-z_\-\s0-9.]+)$/.test(this.state.workspaceName);
    }

    private composeWorkspacePath(): string {
        let workspaceDir = this.state.workspaceDir;
        let workspaceName = this.state.workspaceName;
        if (workspaceDir === null) {
            return workspaceName;
        }
        return workspaceDir + '/' + workspaceName;
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(this.props.dialogId, this.state));
        if (this.props.isNewDialog) {
            this.props.dispatch(actions.newWorkspace(this.composeWorkspacePath()) as any);
        } else {
            this.props.dispatch(actions.saveWorkspaceAs(this.composeWorkspacePath()) as any);
        }
    }

    private onWorkspaceDirChange(ev: any) {
        this.setState({workspaceDir: ev.target.value} as ISelectWorkspaceDialogState);
    }

    private onWorkspaceNameChange(ev: any) {
        this.setState({workspaceName: ev.target.value} as ISelectWorkspaceDialogState);
    }

    private showSelectDirectoryDialog() {
        const openDialogOptions = {
            title: 'Select Directory',
            defaultPath: this.state.workspaceDir,
            buttonLabel: 'Select',
            properties: [
                'openDirectory' as OpenDialogProperty,
            ],
            filter: [],
        };
        this.props.dispatch(actions.showSingleFileOpenDialog(openDialogOptions, (dirPath: string | null) => {
            if (dirPath) {
                this.setState({workspaceDir: dirPath} as ISelectWorkspaceDialogState);
            }
        }) as any);
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title={this.props.isNewDialog ? 'New Workspace' : 'Save Workspace As'}
                confirmTitle={this.props.isNewDialog ? 'New' : 'Save As'}
                onCancel={this.onCancel}
                canConfirm={this.canConfirm}
                onConfirm={this.onConfirm}
                renderBody={this.renderBody}
            />);
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        let directoryChooser = null;
        if (this.props.isLocalFSAllowed) {
            directoryChooser = (
                <React.Fragment>
                    <p style={{marginTop: '1em'}}>Workspace parent directory:</p>
                    <ControlGroup style={{flexGrow: 1, display: 'flex', marginLeft: '1em', width: '100%'}}>
                        <InputGroup
                            type="text"
                            style={{flex: 'auto'}}
                            value={this.state.workspaceDir}
                            onChange={this.onWorkspaceDirChange}
                        />
                        <AnchorButton intent={Intent.PRIMARY} style={{flex: 'none'}}
                                      onClick={this.showSelectDirectoryDialog}>...</AnchorButton>
                    </ControlGroup>
                </React.Fragment>
            );
        }

        return (
            <div>
                {directoryChooser}
                <p style={{marginTop: '1em'}}>Workspace name:</p>
                <InputGroup
                    type="text"
                    style={{width: '100%', marginLeft: '1em'}}
                    value={this.state.workspaceName}
                    onChange={this.onWorkspaceNameChange}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps)(SelectWorkspaceDialog);
