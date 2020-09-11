import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button, Classes, Dialog, Icon, IconName, Intent, ProgressBar } from '@blueprintjs/core';

import { State, WebAPIStatus } from '../state';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IWebAPIStatusBoxProps {
    webAPIStatus: WebAPIStatus | null;
}

function mapStateToProps(state: State): IWebAPIStatusBoxProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
    };
}

const _WebAPIStatusBox: React.FC<IWebAPIStatusBoxProps & IDispatch> = (props) => {
    const history = useHistory();

    const reload = () => {
        window.location.reload();
    };

    const goHome = () => {
        history.replace("/");
    };

    switch (props.webAPIStatus) {
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
                message={'Launching Cate service instance...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'connecting':
            return (<StatusBox
                message={'Connecting to Cate service instance...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'shuttingDown':
            return (<StatusBox
                message={'Shutting down Cate service instance...'}
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
        case 'error':
            return (<StatusBox
                message={'Oops! The connection to the Cate service has been closed unexpectedly.'}
                icon="offline"
                isWaiting={false}
                onRetry={reload}
                onCancel={goHome}
            />);
        default:
            return (<StatusBox
                message={'Oops! No service available.'}
                icon="offline"
                isWaiting={false}
                onCancel={goHome}
            />);
    }
};

const WebAPIStatusBox = connect(mapStateToProps)(_WebAPIStatusBox);
export default WebAPIStatusBox;

interface IStatusBoxProps {
    message: string;
    icon: IconName;
    isWaiting: boolean;
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
