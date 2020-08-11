import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { State } from '../state';
import { IMessageBoxProps, MessageBox } from '../components/desktop/MessageBox';


interface IDispatch {
    dispatch: Dispatch<State>;
}

function mapStateToProps(state: State): IMessageBoxProps {
    if (state.control.messageBox) {
        return {
            isOpen: state.control.messageBox.isOpen,
            onClose: state.control.messageBox.onClose,
            ...state.control.messageBox.options,
        };
    } else {
        return {
            isOpen: false,
            message: '',
        };
    }
}

const _MessageBox: React.FC<IMessageBoxProps & IDispatch> = (props) => {
    return (<MessageBox {...props}/>);
};

export default connect(mapStateToProps)(_MessageBox);
