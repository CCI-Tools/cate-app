import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../state';
import OpenDialog, { IOpenDialogProps } from "../components/desktop/fs/OpenDialog";
import * as actions from "../actions";


function mapStateToProps(state: State) {
    return {
        isOpen: state.control.openDialog.isOpen,
        onClose: state.control.openDialog.onClose,
        rootNode: state.data.fsRootNode,
        ...state.control.openDialog.options,
    };
}

const mapDispatchToProps = {
    updateFileNode: actions.updateFileNode,
};

const _OpenDialog: React.FC<IOpenDialogProps> = (props) => {
    return (<OpenDialog {...props}/>);
};

export default connect(mapStateToProps, mapDispatchToProps)(_OpenDialog);
