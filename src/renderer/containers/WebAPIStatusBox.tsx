import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button, Classes, Dialog, Icon, IconName, Intent, ProgressBar, Spinner } from '@blueprintjs/core';
import * as actions from '../actions';
import MessageDetails from '../components/MessageDetails';

import { State, WebAPIServiceInfo, WebAPIStatus } from '../state';
import { showToast } from '../toast';
import { PodStatus, ServiceProvisionAPI } from "../webapi/apis/ServiceProvisionAPI";


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IWebAPIStatusBoxProps {
    webAPIStatus: WebAPIStatus | null;
    webAPIServiceInfo: WebAPIServiceInfo | null;
    username?: string | null;
}

function mapStateToProps(state: State): IWebAPIStatusBoxProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
        webAPIServiceInfo: state.communication.webAPIServiceInfo,
        username: state.communication.userProfile?.username || null
    };
}

const _WebAPIStatusBox: React.FC<IWebAPIStatusBoxProps & IDispatch> = (
    {
        webAPIStatus,
        webAPIServiceInfo,
        username
    }) => {
    const history = useHistory();

    const reload = () => {
        window.location.reload();
    };

    const goHome = () => {
        history.replace("/");
    };

    switch (webAPIStatus) {
        case 'open':
            return null;
        case 'login':
            return (<StatusBox
                message={'Logging in...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'launching':
            return (<StatusBox
                message={'Launching Cate service...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'connecting':
            return (<StatusBox
                message={'Connecting to Cate service...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'shuttingDown':
            return (<StatusBox
                message={'Shutting down Cate service...'}
                icon="log-out"
                isWaiting={true}
            />);
        case 'loggingOut':
            return (<StatusBox
                message={'Logging out...'}
                icon="log-out"
                isWaiting={true}
            />);
        case 'closed':
            const autoStopInfo = webAPIServiceInfo.autoStopInfo;
            let message: string;
            if (autoStopInfo
                && autoStopInfo.inactivityTime >= autoStopInfo.availableTime - 5) {
                message = 'Cate service has been shut down due to inactivity. ' +
                          'Press "Retry" to try reconnecting.';
                return (<StatusBox
                    message={message}
                    icon="offline"
                    isWaiting={false}
                    onRetry={reload}
                    onCancel={goHome}
                />);
            } else {
                message = 'The connection to the Cate service has been closed unexpectedly.';
                return (<ErrorBox
                    message={message}
                    icon="offline"
                    onRetry={reload}
                    onCancel={goHome}
                    username={username}
                />);
            }
        case 'error':
            return (<ErrorBox
                message={'Oops! An error occurred while launching or connecting the Cate service.'}
                icon="offline"
                onRetry={reload}
                onCancel={goHome}
                username={username}
            />);
        default:
            return (<ErrorBox
                message={'Oops! No service available.'}
                icon="offline"
                onCancel={goHome}
                username={username}
            />);
    }
};

const WebAPIStatusBox = connect(mapStateToProps)(_WebAPIStatusBox);
export default WebAPIStatusBox;


//////////////////////////////////////////////////////////////////////////////

interface IStatusBoxProps {
    message: React.ReactNode;
    icon: IconName;
    isWaiting?: boolean;
    onRetry?: () => void;
    onCancel?: () => void;
}

const DIALOG_P_STYLE: React.CSSProperties = {marginTop: 12};
const DIALOG_ICON_STYLE: React.CSSProperties = {marginTop: 6, textAlign: 'center', width: '100%'};

const StatusBox: React.FC<IStatusBoxProps> = ({
                                                  message,
                                                  icon,
                                                  isWaiting,
                                                  onRetry,
                                                  onCancel,
                                              }) => {

    let progress;
    if (isWaiting) {
        progress = (<div style={DIALOG_P_STYLE}><ProgressBar intent={Intent.SUCCESS}/></div>);
    }
    let footer;
    if (onRetry || onCancel) {
        let cancelButton = onCancel ? (<Button onClick={onCancel} intent={Intent.PRIMARY}>Cancel</Button>) : null;
        let retryButton = onRetry ? (<Button onClick={onRetry}>Retry</Button>) : null;
        footer = (
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    {cancelButton}
                    {retryButton}
                </div>
            </div>
        );
    }
    return (
        <Dialog
            isOpen={true}
            canEscapeKeyClose={false}
            canOutsideClickClose={false}
        >
            <div className={Classes.DIALOG_BODY}>
                <div style={DIALOG_ICON_STYLE}><Icon icon={icon} iconSize={32}/></div>
                <div style={DIALOG_P_STYLE}>{message}</div>
                {progress}
            </div>
            {footer}
        </Dialog>
    );
};

//////////////////////////////////////////////////////////////////////////////

interface IErrorBoxProps extends IStatusBoxProps {
    username?: string;
}

const ErrorBox: React.FC<IErrorBoxProps> = (
    {
        message,
        icon,
        isWaiting,
        onRetry,
        onCancel,
        username,
    }
) => {
    const extendedMessage = (
        <>
            {message}
            {username && (
                <PodStatusMessage
                    username={username}
                />
            )}
        </>
    );
    return (<StatusBox
        message={extendedMessage}
        icon={icon}
        isWaiting={isWaiting}
        onRetry={onRetry}
        onCancel={onCancel}
    />);
};

//////////////////////////////////////////////////////////////////////////////

type PodStatusState = 'init' | 'loading' | 'success' | 'error';

interface IPodStatusMessageProps {
    username: string;
    hint?: React.ReactNode;
}

const PodStatusMessage: React.FC<IPodStatusMessageProps> = (
    {
        username,
    }) => {
    const [podStatusState, setPodStatusState] = React.useState<PodStatusState>('init');
    const [podStatus, setPodStatus] = React.useState<PodStatus>(null);
    React.useEffect(() => {
        if (username && podStatusState === 'init') {
            setPodStatusState('loading');
            new ServiceProvisionAPI().getPodStatus(username).then(podStatus => {
                setPodStatusState('success');
                setPodStatus(podStatus);
            }).catch(() => {
                setPodStatusState('error');
            });
        }
    }, [username, podStatusState]);

    let extraMessage = null;
    if (podStatusState === 'init' || podStatusState === 'loading') {
        extraMessage = (<div>Fetching container status...&nbsp;<Spinner size={16}/></div>);
    } else if (podStatusState === 'error') {
        extraMessage = 'Failed fetching container status.';
    } else if (podStatusState === 'success' && podStatus) {
        extraMessage = 'Container error.';
        const containerStatuses = podStatus?.container_statuses;
        if (containerStatuses && containerStatuses.length > 0) {
            const terminatedState = containerStatuses[0].last_state?.terminated
                || containerStatuses[0].state?.terminated;
            if (terminatedState) {
                const terminationReason = terminatedState.reason;
                const terminationExitCode = terminatedState.exit_code;
                extraMessage = `Container terminated. Reason: ${terminationReason}, exit code ${terminationExitCode}.`;
            }
        }
    }

    if (!podStatus) {
        return (<div style={{marginTop: '0.5em'}}>{extraMessage}</div>);
    }

    function handleCopyDetails(details: string) {
        actions.copyTextToClipboard(details);
        showToast({type: 'info', text: 'Details copied to clipboard.'});
    }

    return (
        <>
            <div style={{marginTop: '0.5em'}}>{extraMessage}</div>
            <MessageDetails
                details={JSON.stringify(podStatus, null, 2)}
                onCopyDetails={handleCopyDetails}
            />
            <div style={{marginTop: '0.5em'}} className='bp4-text-small bp4-text-muted'>
                This error typically occurs if our cloud resources are depleted.
                This is likely due to high server loads caused by running demanding tasks
                and/or multiple users competing for resources.<br/>
                To mitigate loss of data and time, we recommend that you save your workspace
                often and enable the setting <strong>Reopen last workspace on startup</strong> in
                the preferences.
            </div>
        </>
    );
};
