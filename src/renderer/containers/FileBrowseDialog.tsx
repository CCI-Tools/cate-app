import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../state';
import OpenDialog, { IOpenDialogProps } from "../components/desktop/fs/OpenDialog";
import * as actions from "../actions";


function mapStateToProps(state: State) {
    return {
        ...state.control.fileBrowseDialog.options,
        isOpen: state.control.fileBrowseDialog.isOpen,
        onClose: state.control.fileBrowseDialog.onClose,
        rootNode: state.data.fsRootNode,
        hostOS: state.communication.webAPIServiceInfo.hostOS,
    };
}

const mapDispatchToProps = {
    updateFileNode: actions.updateFileNode,
};

const FileBrowseDialog: React.FC<IOpenDialogProps> = (props) => {
    let properties = props.properties;
    if (properties) {
        const propSet = new Set(properties);
        propSet.delete("openFile");
        propSet.delete("openDirectory");
        properties = Array.from(propSet);
    } else {
        properties = [];
    }
    return (props.isOpen) ? (<OpenDialog title="Browse Files" {...props} properties={properties}/>) : null;
};

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowseDialog);
