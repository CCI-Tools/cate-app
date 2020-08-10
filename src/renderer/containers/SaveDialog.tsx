import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../state';
import SaveDialog, { ISaveDialogProps } from "../components/desktop/fs/SaveDialog";
import * as actions from "../actions";


function mapStateToProps(state: State) {
    return {
        isOpen: state.control.saveDialog.isOpen,
        onClose: state.control.saveDialog.onClose,
        rootNode: state.data.fsRootNode,
        ...state.control.saveDialog.options,
    };
}

const mapDispatchToProps = {
    updateFileNode: actions.updateFileNode,
};

const _SaveDialog: React.FC<ISaveDialogProps> = (props) => {
    return (<SaveDialog {...props}/>);
};

export default connect(mapStateToProps, mapDispatchToProps)(_SaveDialog);
