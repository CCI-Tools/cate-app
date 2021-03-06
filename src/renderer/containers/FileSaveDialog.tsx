import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../state';
import SaveDialog, { ISaveDialogProps } from "../components/desktop/fs/SaveDialog";
import * as actions from "../actions";


function mapStateToProps(state: State) {
    return {
        ...state.control.fileSaveDialog.options,
        isOpen: state.control.fileSaveDialog.isOpen,
        onClose: state.control.fileSaveDialog.onClose,
        rootNode: state.data.fsRootNode,
        hostOS: state.communication.webAPIServiceInfo.hostOS,
    };
}

const mapDispatchToProps = {
    updateFileNode: actions.updateFileNode,
};

const FileSaveDialog: React.FC<ISaveDialogProps> = (props) => {
    return (props.isOpen) ? (<SaveDialog {...props}/>) : null;
};

export default connect(mapStateToProps, mapDispatchToProps)(FileSaveDialog);
