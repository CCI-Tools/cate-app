import * as React from 'react';
import { hideShutdownDialog } from '../actions';
import { State } from '../state';
import { ModalDialog } from '../components/ModalDialog';
import { connect, DispatchProp } from 'react-redux';
import * as selectors from '../selectors';
import { ServiceShutdownAPI } from '../webapi';


const DIALOG_ID = "shutdownDialog";

interface IServiceShutdownDialogProps {
    isOpen: boolean;
    webAPIServiceURL: string;
}

function mapStateToProps(state: State): IServiceShutdownDialogProps {
    const dialogState = selectors.dialogStateSelector(DIALOG_ID)(state);

    return {
        isOpen: dialogState.isOpen,
        webAPIServiceURL: selectors.webAPIServiceURLSelector(state),
    };
}

const ServiceShutdownDialog: React.FC<IServiceShutdownDialogProps & DispatchProp<State>> = (
    {
        isOpen,
        webAPIServiceURL,
        dispatch
    }
) => {
    let [waiting, setWaiting] = React.useState(false);

    if (!isOpen) {
        return null;
    }

    const handleShutdown = () => {
        // Make any harmless REST call so the
        // server's inactivity timer is reset:
        try {
            setWaiting(true);
            // noinspection JSIgnoredPromiseFromCall
            new ServiceShutdownAPI().shutdown(webAPIServiceURL).then(() => {
                dispatch(hideShutdownDialog());
            });
        } catch (error) {
            setWaiting(false);
        }
    }

    const handleClose = () => {
        dispatch(hideShutdownDialog());
    }

    const renderBody = () => {
        return (
            <p>
                This will shut down the Cate service.
                Unsaved changes will be lost.
            </p>
        );
    }

    return (
        <ModalDialog
            isOpen={true}
            title="Service Shutdown"
            icon="offline"
            noCancelButton={false}
            confirmTitle="Shutdown"
            confirmIconName="offline"
            canConfirm={() => !waiting}
            onConfirm={handleShutdown}
            onCancel={handleClose}
            renderBody={renderBody}
        />
    );
}

export default connect(mapStateToProps)(ServiceShutdownDialog);

