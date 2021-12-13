import * as React from 'react';
import { State, WebAPIServiceInfo } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as selectors from '../selectors';
import { ServiceInfoAPI } from '../webapi/apis/ServiceInfoAPI';

// Duration in seconds the ServiceAutoCloseDialog is
// shown before server auto-shutdown.
//
const DIALOG_DURATION = (process.env.NODE_ENV === 'development' ? 1 : 15) * 60;

interface IServiceAutoCloseDialogProps {
    webAPIServiceInfo: WebAPIServiceInfo | null;
    webAPIServiceURL: string;
}

function mapStateToProps(state: State): IServiceAutoCloseDialogProps {
    return {
        webAPIServiceInfo: selectors.webAPIServiceInfoSelector(state),
        webAPIServiceURL: selectors.webAPIServiceURLSelector(state),
    };
}

const ServiceAutoCloseDialog: React.FC<IServiceAutoCloseDialogProps & DispatchProp<State>> = (
    {
        webAPIServiceInfo,
        webAPIServiceURL,
    }
) => {
    if (!webAPIServiceInfo) {
        return null;
    }

    const autoStopInfo = webAPIServiceInfo.autoStopInfo;
    if (!autoStopInfo) {
        return null;
    }

    const {availableTime, remainingTime, inactivityTime} = autoStopInfo;
    if (!availableTime || !remainingTime || !inactivityTime) {
        return null;
    }

    const remainingTimeMin = 1;
    const remainingTimeMax = Math.min(DIALOG_DURATION, availableTime);
    const shouldShow = remainingTime > remainingTimeMin
                       && remainingTime < remainingTimeMax;
    if (!shouldShow) {
        return null;
    }

    const canConfirm = () => {
        return true;
    }

    const handleClose = () => {
        // Make any harmless REST call so the
        // server's inactivity timer is reset:
        try {
            // noinspection JSIgnoredPromiseFromCall
            new ServiceInfoAPI().getServiceInfo(webAPIServiceURL);
        } catch (error) {
            console.error(error);
        }
    }

    const renderBody = () => {
        return (
            <div>
                <p>
                    The Cate service will shut down soon due to inactivity
                    since {formatSeconds(inactivityTime)}.
                    After the shutdown you will need to reconnect/login first.
                    Unsaved changes will be lost.
                </p>
                <p>
                    The remaining time is <strong>{formatSeconds(remainingTime)}</strong>.
                </p>
                <p>
                    Press "Keep Alive" to prevent the shutdown.
                </p>
            </div>
        );
    }

    return (
        <ModalDialog
            isOpen={true}
            title="Service Shutdown Ahead"
            icon="offline"
            noCancelButton={true}
            confirmTitle="Keep Alive"
            confirmIconName="link"
            confirmTooltip="Requests keeping the service available."
            onCancel={handleClose}
            onConfirm={handleClose}
            canConfirm={canConfirm}
            renderBody={renderBody}
        />
    );
}

export default connect(mapStateToProps)(ServiceAutoCloseDialog);


function formatSeconds(value: number): string {
    const hours = Math.floor(value / 3600);
    const remainder = value - hours * 3600;
    const minutes = Math.floor(remainder / 60);
    const seconds = Math.round(remainder - minutes * 60);
    const parts = [];
    if (hours > 0) {
        parts.push(`${hours} hour${hours !== 1 ? 's': ''}`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes !== 1 ? 's': ''}`);
    }
    parts.push(`${seconds} second${seconds !== 1 ? 's': ''}`);
    return parts.join(', ');
}