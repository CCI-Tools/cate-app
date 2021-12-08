import { IActionProps, ILinkProps, Intent, IToaster, Position, Toaster } from '@blueprintjs/core';
import { MessageState } from './state';

let MessageToaster: IToaster | null = null;

export function showToast(message: MessageState, timeout?: number) {

    if (!MessageToaster) {
        MessageToaster = Toaster.create({
                                            className: 'cate-toaster',
                                            position: Position.BOTTOM,
                                        });
    }

    let icon;
    let intent;
    if (message.type === 'info') {
        icon = 'info-sign';
        intent = Intent.NONE;
        timeout = timeout || 2500;
    } else if (message.type === 'success') {
        icon = 'tick';
        intent = Intent.SUCCESS;
        timeout = timeout || 2500;
    } else if (message.type === 'notification') {
        icon = 'notifications';
        intent = Intent.PRIMARY;
        timeout = timeout || 2500;
    } else if (message.type === 'warning') {
        icon = 'warning-sign';
        intent = Intent.WARNING;
        timeout = timeout || 6000;
    } else if (message.type === 'error') {
        icon = 'error';
        intent = Intent.DANGER;
        timeout = timeout || 10000;
    } else {
        timeout = timeout || 5000;
    }

    let action: IActionProps & ILinkProps;
    if (message.action) {
        action = {
            onClick: message.action.onClick,
            text: message.action.text,
            icon: message.action.icon,
            href: message.action.href,
            target: message.action.href ? '_blank' : undefined,
        }
    }

    MessageToaster.show({
                            message: message.text,
                            icon,
                            intent,
                            action,
                            timeout,
                        });
}
