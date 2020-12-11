import * as React from 'react';
import { AnchorButton, ControlGroup, Intent, Switch, Tab, Tabs } from '@blueprintjs/core';
import { connect, DispatchProp } from 'react-redux';

import { SessionState, State, WebAPIServiceInfo } from '../state';
import * as actions from '../actions';
import { showMessageBox } from '../actions';
import * as selectors from '../selectors';
import { TextField } from '../components/field/TextField';
import deepEqual from 'deep-equal';
import { ModalDialog } from '../components/ModalDialog';
import { showToast } from '../toast';
import { isDefined } from '../../common/types';

// IMPORTANT:
// 1. Synchronize any changes of CATE_WEBUI_VERSION with the version field in "./package.json".
// 2. Increase PWA_VERSION in "./src/serviceWorker.ts"
//
const CATE_WEBUI_VERSION = "2.2.2-dev.3";


interface IPreferencesDialogProps {
    isOpen: boolean;
    preferences: SessionState;
    serviceInfo: WebAPIServiceInfo,
    serviceURL: string,
}

function mapStateToProps(state: State): IPreferencesDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(PreferencesDialog.DIALOG_ID)(state).isOpen,
        preferences: state.session,
        serviceURL: state.communication.webAPIServiceURL,
        serviceInfo: state.communication.webAPIServiceInfo,
    };
}


const ABOUT_LABEL_STYLE = {width: '40%'};
const ABOUT_CONTROL_GROUP_STYLE = {width: '100%', marginBottom: '1em'};
const ABOUT_DIV_STYLE = {width: '100%', marginTop: '1em'};
const ABOUT_ITEM_STYLE:  React.CSSProperties = {width: '60%', wordWrap: 'break-word'};

class PreferencesDialog extends React.Component<IPreferencesDialogProps & DispatchProp<State>, SessionState> {
    static readonly DIALOG_ID = 'preferencesDialog';
    static readonly DIALOG_TITLE = 'Preferences';

    constructor(props: IPreferencesDialogProps & DispatchProp<State>) {
        super(props);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = props.preferences;
    }

    componentWillReceiveProps(nextProps: IPreferencesDialogProps) {
        this.setState(nextProps.preferences);
    }

    private onConfirm() {
        this.props.dispatch(actions.hidePreferencesDialog());
        if (!deepEqual(this.props.preferences, this.state)) {
            const backendConfig = this.state.backendConfig;
            const autoUpdateSoftwareChangeDetected = this.props.preferences.autoUpdateSoftware !== this.state.autoUpdateSoftware;
            const backendChangesDetected = !deepEqual(this.props.preferences.backendConfig, backendConfig);
            this.props.dispatch(actions.updatePreferences(this.state) as any);
            if (autoUpdateSoftwareChangeDetected || backendChangesDetected) {
                this.props.dispatch(actions.storeBackendConfig(backendConfig) as any);
                this.props.dispatch(showMessageBox({
                                                       type: 'info',
                                                       title: PreferencesDialog.DIALOG_TITLE,
                                                       message: 'Some changes will be effective only after restart.'
                                                   }) as any);
            }
        } else {
            showToast({
                          type: 'info',
                          text: 'No changes detected.'
                      });
        }
    }

    private onCancel() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    //noinspection JSMethodCanBeStatic
    private canConfirm() {
        // TODO (forman): add validation of preferences changes
        return true;
    }

    render() {
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                title={PreferencesDialog.DIALOG_TITLE}
                icon="confirm"
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        return (
            <Tabs id="preferences">
                <Tab id="g" title="General" panel={this.renderGeneralPanel()}/>
                <Tab id="dm" title="Data Management" panel={this.renderDataManagementPanel()}/>
                <Tab id="pc" title="Proxy Configuration" panel={this.renderProxyConfigurationPanel()}/>
                <Tab id="a" title="About" panel={this.renderAboutPanel()}/>
            </Tabs>
        );
    }

    private renderGeneralPanel() {
        const userRootMode = this.props.serviceInfo.userRootMode;
        return (
            <div style={{width: '100%', marginTop: '1em'}}>
                {this.renderReopenLastWorkspace()}
                {this.renderAutoShowNewFigures()}
                {this.renderPanelContainerUndockedMode()}
                {!userRootMode && this.renderAutoUpdates()}
                {!userRootMode && this.renderOfflineMode()}
            </div>
        );
    }

    private renderDataManagementPanel() {
        const userRootMode = this.props.serviceInfo.userRootMode;
        return (
            <div style={{width: '100%', marginTop: '1em'}}>
                {!userRootMode && this.renderDataStoresPath()}
                {!userRootMode && this.renderCacheWorkspaceImagery()}
                {this.renderResourceNamePrefix()}
            </div>
        );
    }

    private renderProxyConfigurationPanel() {
        return (
            <div style={{width: '100%', marginTop: '1em'}}>
                {this.renderProxyUrlInput()}
            </div>
        );
    }

    private renderAboutPanel() {
        return (
            <div style={ABOUT_DIV_STYLE}>
                <ControlGroup style={ABOUT_CONTROL_GROUP_STYLE}>
                    <span style={ABOUT_LABEL_STYLE}>Cate UI version:</span>
                    <span style={ABOUT_ITEM_STYLE}><code>{CATE_WEBUI_VERSION}</code></span>
                </ControlGroup>
                <ControlGroup style={ABOUT_CONTROL_GROUP_STYLE}>
                    <span style={ABOUT_LABEL_STYLE}>Cate service URL:</span>
                    <span style={ABOUT_ITEM_STYLE}><code>{this.props.serviceURL}</code></span>
                </ControlGroup>
                <ControlGroup style={ABOUT_CONTROL_GROUP_STYLE}>
                    <span style={ABOUT_LABEL_STYLE}>Cate service version:</span>
                    <span style={ABOUT_ITEM_STYLE}><code>{this.props.serviceInfo.version}</code></span>
                </ControlGroup>
                <ControlGroup style={ABOUT_CONTROL_GROUP_STYLE}>
                    <span style={ABOUT_LABEL_STYLE}>Cate service mode:</span>
                    <span style={ABOUT_ITEM_STYLE}>
                        {this.props.serviceInfo.userRootMode ? 'user root' : 'without user root'}
                    </span>
                </ControlGroup>
            </div>
        );
    }

    private renderReopenLastWorkspace() {
        return this.renderBooleanValue(
            'reopenLastWorkspace',
            false,
            'Reopen last workspace on startup'
        );
    }

    private renderAutoUpdates() {
        return this.renderBooleanValue(
            'autoUpdateSoftware',
            false,
            'Automatic software updates'
        );
    }

    private renderAutoShowNewFigures() {
        return this.renderBooleanValue(
            'autoShowNewFigures',
            false,
            'Open plot view for new Figure resources'
        );
    }

    private renderOfflineMode() {
        return this.renderBooleanValue(
            'offlineMode',
            false,
            'Force offline mode (requires restart)'
        );
    }

    private renderPanelContainerUndockedMode() {
        return this.renderBooleanValue(
            'panelContainerUndockedMode',
            false,
            'Undocked tool panels (experimental)'
        );
    }

    private renderDataStoresPath() {
        return this.renderDirectoryPath(
            'dataStoresPath',
            true,
            'Synchronisation directory for remote data store files'
        );
    }

    private renderCacheWorkspaceImagery() {
        return this.renderBooleanValue(
            'useWorkspaceImageryCache',
            true,
            'Use per-workspace imagery cache (may accelerate image display)'
        );
    }

    private renderResourceNamePrefix() {
        return this.renderStringValue(
            'resourceNamePattern',
            true,
            'Default resource name pattern'
        );
    }

    private renderProxyUrlInput() {
        const initialValue = this.getStateValue('proxyUrl', true);
        const onChange = this.getChangeHandler('proxyUrl', true);
        return (
            <ControlGroup style={{width: '100%', marginBottom: '1em', display: 'flex', alignItems: 'center'}}>
                <span style={{flexGrow: 0.8}}>Proxy URL:</span>
                <TextField className="bp3-input bp3-fill"
                           style={{flexGrow: 0.2}}
                           value={initialValue}
                           onChange={onChange}
                           placeholder={'http://user:password@host:port'}
                           nullable={true}
                />
            </ControlGroup>
        );
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Components
    // Note (forman): could make this React component later

    private renderDirectoryPath(propertyName, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div style={{width: '100%', marginBottom: '1em'}}>
                <p>{label}:</p>
                <ControlGroup style={{display: 'flex', alignItems: 'center'}}>
                    <TextField style={{flexGrow: 1}}
                               value={initialValue}
                               placeholder="Enter directory path"
                               onChange={onChange}
                    />
                    <AnchorButton
                        intent={Intent.PRIMARY} style={{flex: 'none'}}
                        onClick={() => this.showOpenDirectoryDialog(initialValue, onChange)}>
                        ...
                    </AnchorButton>
                </ControlGroup>
            </div>
        );
    }

    private renderStringValue(propertyName: string, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <ControlGroup style={{width: '100%', marginBottom: '1em', display: 'flex', alignItems: 'center'}}>
                <span style={{flexGrow: 0.8}}>{label}:</span>
                <TextField style={{flexGrow: 0.2}}
                           value={initialValue}
                           onChange={onChange}
                />
            </ControlGroup>
        );
    }

    private renderBooleanValue(propertyName: string, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div style={{width: '100%', marginBottom: '1em'}}>
                <Switch checked={initialValue}
                        label={label}
                        onChange={(event: any) => onChange(event.target.checked)}/>
            </div>
        );
    }

    private getChangeHandler(propertyName: string, isBackend: boolean) {
        return (value: any) => {
            const change = {};
            change[propertyName] = isDefined(value) ? (isDefined(value.value) ? value.value : value) : null;
            if (isBackend) {
                this.setBackendConfig(change);
            } else {
                this.setState(change as SessionState);
            }
        };
    }

    private getStateValue(propertyName: string, isBackend: boolean) {
        return isBackend ? this.state.backendConfig[propertyName] : this.state[propertyName];
    }

    private setBackendConfig(backendConfigDelta: any) {
        const backendConfig = Object.assign({}, this.state.backendConfig, backendConfigDelta);
        this.setState({backendConfig} as SessionState);
    }

    private showOpenDirectoryDialog(defaultPath: string, onChange: (value) => void) {
        this.props.dispatch(actions.showDirectorySelectDialog({defaultPath},
                                                              (dirPath: string | null) => {
                                                                  if (dirPath) {
                                                                      onChange(dirPath);
                                                                  }
                                                              }) as any);
    }
}

export default connect(mapStateToProps)(PreferencesDialog);



