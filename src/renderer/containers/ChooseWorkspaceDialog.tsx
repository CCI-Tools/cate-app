import * as React from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Checkbox, Tooltip } from '@blueprintjs/core';

import { DialogState, State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { ListBox, ListBoxSelectionMode } from '../components/ListBox';


interface IChooseWorkspaceDialogState extends DialogState {
    workspaceDir: string | null;
    currentWorkspaceName: string;
    selectedWorkspaceName: string;
    deleteEntireWorkspace: boolean;
}

interface IChooseWorkspaceDialogOwnProps {
    dialogId: string;
}

interface IChooseWorkspaceDialogProps extends IChooseWorkspaceDialogState, IChooseWorkspaceDialogOwnProps {
    isOpen: boolean;
    isLocalFSAllowed: boolean;
    workspaceNames: string[];
}

export const OPEN_WORKSPACE_DIALOG_ID = 'openWorkspaceDialog';
export const DELETE_WORKSPACE_DIALOG_ID = 'deleteWorkspaceDialog';

function mapStateToProps(state: State, ownProps: IChooseWorkspaceDialogOwnProps): IChooseWorkspaceDialogProps {
    const dialogState = selectors.dialogStateSelector(ownProps.dialogId)(state) as any;
    const isOpen = dialogState.isOpen;
    const dialogId = ownProps.dialogId;
    const isLocalFSAllowed = selectors.isLocalFSAccessAllowedSelector(state);
    let workspaceDir = dialogState.workspaceDir;
    let currentWorkspaceName = dialogState.workspaceName;
    let selectedWorkspaceName = '';
    // TODO (forman): Fix code duplication with SelectWorkspaceDialog
    if (isOpen) {
        if (!selectors.isScratchWorkspaceSelector(state)) {
            workspaceDir = workspaceDir || selectors.workspaceDirSelector(state);
            currentWorkspaceName = currentWorkspaceName || selectors.workspaceNameSelector(state);
        }
        workspaceDir = workspaceDir || selectors.lastWorkspaceDirSelector(state);
    }
    workspaceDir = isLocalFSAllowed ? workspaceDir || '' : null;
    currentWorkspaceName = currentWorkspaceName || '';
    let workspaceNames: string[];
    if (state.data.workspace && state.data.workspaceNames) {
        workspaceNames = [...state.data.workspaceNames];
        let indexOf = workspaceNames.indexOf(currentWorkspaceName);
        if (indexOf > -1) {
            workspaceNames.splice(indexOf, 1);
        }
    }
    return {
        workspaceDir,
        currentWorkspaceName,
        selectedWorkspaceName,
        dialogId,
        isOpen,
        isLocalFSAllowed: isLocalFSAllowed,
        workspaceNames: workspaceNames,
        deleteEntireWorkspace: this.deleteEntireWorkspace
    };
}

class ChooseWorkspaceDialog extends React.Component<IChooseWorkspaceDialogProps & IChooseWorkspaceDialogOwnProps & DispatchProp<State>, IChooseWorkspaceDialogState> {

    constructor(props: IChooseWorkspaceDialogProps & DispatchProp<State>) {
        super(props);
        this.state = {
            workspaceDir: '',
            currentWorkspaceName: '',
            selectedWorkspaceName: '',
            deleteEntireWorkspace: true
        };
        // TODO (forman): Fix code duplication with SelectWorkspaceDialog
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onWorkspaceNameChange = this.onWorkspaceNameChange.bind(this);
        this.onWorkspaceDirChange = this.onWorkspaceDirChange.bind(this);
    }

    componentWillReceiveProps(nextProps: IChooseWorkspaceDialogProps) {
        this.setState({workspaceDir: nextProps.workspaceDir, currentWorkspaceName: nextProps.currentWorkspaceName});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(this.props.dialogId));
        this.resetSelectedWorkspaceName();
    }

    private canConfirm(): boolean {
        if (this.state.selectedWorkspaceName === 'undefined' || !this.state.selectedWorkspaceName) {
            return false;
        }
        return /^([A-Za-z_\-\s0-9.]+)$/.test(this.state.selectedWorkspaceName);
    }

    private composeWorkspacePath(): string {
        let workspaceDir = this.state.workspaceDir;
        let workspaceName = this.state.selectedWorkspaceName;
        if (workspaceDir === null) {
            return workspaceName;
        }
        return workspaceDir + '/' + workspaceName;
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(this.props.dialogId, this.state));
        if (this.props.dialogId === DELETE_WORKSPACE_DIALOG_ID) {
            this.props.dispatch(actions.deleteWorkspace(this.composeWorkspacePath(), this.state.deleteEntireWorkspace) as any);
        } else {
            this.props.dispatch(actions.openWorkspace(this.composeWorkspacePath()) as any);
        }
        this.resetSelectedWorkspaceName();
    }

    private resetSelectedWorkspaceName() {
        this.setState({selectedWorkspaceName: ''});
    }

    private setSelectedWorkspace(workspaceName: string) {
        this.setState({selectedWorkspaceName: workspaceName});
    }

    private handleCheckboxChange(event) {
        this.setState({deleteEntireWorkspace: event.target.checked});
    }

    private onWorkspaceDirChange(ev: any) {
        this.setState({workspaceDir: ev.target.value} as IChooseWorkspaceDialogState);
    }

    private onWorkspaceNameChange(ev: any) {
        this.setState({currentWorkspaceName: ev.target.value} as IChooseWorkspaceDialogState);
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        let title: string;
        let confirmTitle: string;
        if (this.props.dialogId === DELETE_WORKSPACE_DIALOG_ID) {
            title = 'Delete Workspace';
            confirmTitle = 'Delete';
        } else {
            title = 'Open Workspace';
            confirmTitle = 'Open';
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title={title}
                confirmTitle={confirmTitle}
                onCancel={this.onCancel}
                canConfirm={this.canConfirm}
                onConfirm={this.onConfirm}
                renderBody={this.renderBody}
            />);
    }

    renderItem = (path: string) => {
        return (<span>{path}</span>);
    };

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        if (this.props.workspaceNames.length === 0) {
            return (
                <div>
                    <p style={{marginTop: '1em'}}>No saved workspaces found.</p>
                </div>
            );
        }

        let checkbox;
        if (this.props.dialogId === DELETE_WORKSPACE_DIALOG_ID) {
            checkbox =
                <Tooltip content={"Also delete other files in the workspace folder"}>
                    <Checkbox
                        style={{marginTop: '1em'}}
                        label={'Delete entire workspace'}
                        checked={this.state.deleteEntireWorkspace}
                        onChange={this.handleCheckboxChange.bind(this)}
                    />
                </Tooltip>
        }

        return (
            <div>
                <p style={{marginTop: '1em'}}>Saved workspaces:</p>
                <ListBox items={this.props.workspaceNames}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         getItemKey={(item: any, itemIndex: number) => item}
                         renderItem={this.renderItem}
                         onSelection={newSelection => this.setSelectedWorkspace('' + newSelection[0])}
                         selection={this.state.selectedWorkspaceName}
                />
                {checkbox}
            </div>
        );
    }
}

export default connect(mapStateToProps)(ChooseWorkspaceDialog);
