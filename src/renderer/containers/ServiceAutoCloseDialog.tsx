import * as React from 'react';
import { State, WebAPIServiceInfo } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as selectors from '../selectors';
import { ServiceInfoAPI } from '../webapi/apis/ServiceInfoAPI';


interface IServiceAutoCloseDialogProps {
    webAPIServiceInfo: WebAPIServiceInfo | null;
    webAPIServiceURL: string;
}

function mapStateToProps(state: State): IServiceAutoCloseDialogProps {
    const webAPIServiceInfo = selectors.webAPIServiceInfoSelector(state);
    const webAPIServiceURL = selectors.webAPIServiceURLSelector(state);
    return {
        webAPIServiceInfo,
        webAPIServiceURL,
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

    const availableTime = autoStopInfo.availableTime || (5 * 60);
    const remainingTimeMin = 1;
    const remainingTimeMax = Math.min(0.25 * availableTime, 15 * 60);

    const remainingTime = autoStopInfo.remainingTime;
    if (!remainingTime) {
        return null;
    }

    const shouldShow = remainingTime > remainingTimeMin && remainingTime < remainingTimeMax;
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
                    The Cate service will close soon due to inactivity!
                    You will then need to reconnect manually.
                    Your unsaved changes will be lost.
                </p>
                <p>
                    The remaining time is <strong>{formatSeconds(remainingTime)}</strong>.
                    You are inactive since <strong>{formatSeconds(autoStopInfo.inactivityTime)}</strong>.
                </p>
            </div>
        );
    }

    return (
        <ModalDialog
            isOpen={true}
            title="Service Shut-down Ahead"
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