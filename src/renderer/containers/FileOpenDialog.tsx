import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../state';
import OpenDialog, { IOpenDialogProps } from "../components/desktop/fs/OpenDialog";
import * as actions from "../actions";


function mapStateToProps(state: State) {
    return {
        ...state.control.fileOpenDialog.options,
        isOpen: state.control.fileOpenDialog.isOpen,
        onClose: state.control.fileOpenDialog.onClose,
        rootNode: state.data.fsRootNode,
        hostOS: state.communication.webAPIServiceInfo.hostOS,
    };
}

const mapDispatchToProps = {
    updateFileNode: actions.updateFileNode,
};

const FileOpenDialog: React.FC<IOpenDialogProps> = (props) => {
    return (props.isOpen) ? (<OpenDialog {...props}/>) : null;
};

export default connect(mapStateToProps, mapDispatchToProps)(FileOpenDialog);
