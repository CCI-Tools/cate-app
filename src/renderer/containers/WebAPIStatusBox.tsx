import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Button, Classes, Dialog, Icon, IconName, Intent, ProgressBar } from '@blueprintjs/core';

import { State, WebAPIServiceInfo, WebAPIStatus } from '../state';


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
    };
}

const _WebAPIStatusBox: React.FC<IWebAPIStatusBoxProps & IDispatch> = (
    {
        webAPIStatus,
        webAPIServiceInfo,
    }) => {

    const reload = () => {
        window.location.reload();
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
                />);
            } else {
                message = 'The connection to the Cate service has been closed unexpectedly.';
                return (<ErrorBox
                    message={message}
                    icon="offline"
                    onRetry={reload}
                />);
            }
        case 'error':
            return (<ErrorBox
                message={'Oops! An error occurred while launching or connecting the Cate service.'}
                icon="offline"
                onRetry={reload}
            />);
        default:
            return (<ErrorBox
                message={'Oops! No service available.'}
                icon="offline"
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
    }
) => {
    return (<StatusBox
        message={message}
        icon={icon}
        isWaiting={isWaiting}
        onRetry={onRetry}
        onCancel={onCancel}
    />);
};
