import * as React from 'react';
import { Button, Checkbox, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { isDefined } from '../../../common/types';
import { ModalDialog } from '../ModalDialog';
import { MessageBoxOptions, MessageBoxResult } from './types';


export interface IMessageBoxProps extends MessageBoxOptions {
    isOpen?: boolean;
    onClose?: (result: MessageBoxResult | null) => any;
}

const icons = {
    none: undefined,
    info: IconNames.INFO_SIGN,
    error: IconNames.ERROR,
    question: IconNames.CONFIRM,
    warning: IconNames.WARNING_SIGN,
}

export const MessageBox: React.FC<IMessageBoxProps> = (
    {
        isOpen,
        onClose,
        type,
        title,
        message,
        detail,
        buttons,
        checkboxLabel,
        checkboxChecked,
        defaultId,
        cancelId,
    }) => {
    const [_checkboxChecked, setCheckboxChecked] = React.useState<boolean>((isDefined(checkboxChecked) && checkboxChecked));
    const hasCheckbox = Boolean(checkboxLabel);
    if (!isOpen) {
        return null;
    }
    const handleButtonClick = (buttonIndex: number) => {
        if (onClose) {
            onClose({buttonIndex, checkboxChecked: _checkboxChecked});
        }
    }
    const handleCancel = () => {
        if (onClose) {
            onClose(null);
        }
    }

    const renderActions = () => {
        const actions = (buttons || ["OK"]).map(
            (buttonText, buttonIndex) => {
                const intent = buttonIndex === defaultId ? Intent.PRIMARY : Intent.NONE;
                if (buttonIndex === cancelId) {
                    return <Button intent={intent} onClick={handleCancel}>{buttonText}</Button>;
                } else {
                    return <Button intent={intent} onClick={() => handleButtonClick(buttonIndex)}>{buttonText}</Button>;
                }
            }
        );
        return actions;
    }

    const handleCheckboxChange = (event) => {
        setCheckboxChecked(event.target.checked);
    }
    return (
        <ModalDialog
            isOpen={isOpen}
            title={title}
            icon={icons[type]}
            onCancel={handleCancel}
            renderActions={renderActions}
        >
            <p>{message}</p>
            <p>{detail}</p>
            {hasCheckbox && <p><Checkbox label={checkboxLabel} onChange={handleCheckboxChange}/></p>}
        </ModalDialog>
    );
};
