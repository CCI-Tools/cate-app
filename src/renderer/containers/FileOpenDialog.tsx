import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../state';
import OpenDialog, { IOpenDialogProps } from "../components/desktop/fs/OpenDialog";
import * as actions from "../actions";


function mapStateToProps(state: State) {
    return {
        isOpen: state.control.fileOpenDialog.isOpen,
        onClose: state.control.fileOpenDialog.onClose,
        rootNode: state.data.fsRootNode,
        ...state.control.fileOpenDialog.options,
    };
}

const mapDispatchToProps = {
    updateFileNode: actions.updateFileNode,
};

const FileOpenDialog: React.FC<IOpenDialogProps> = (props) => {
    return (<OpenDialog {...props}/>);
};

export default connect(mapStateToProps, mapDispatchToProps)(FileOpenDialog);
