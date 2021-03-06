import { IconName } from '@blueprintjs/icons';
import * as React from 'react'

export interface IPanelProps {
    id: string;
    title: string;
    icon: IconName;
    body?: JSX.Element | null;
    position?: 'top' | 'bottom';
}

/**
 * A Panel is a child element of a PanelContainer.
 *
 * @author Norman Fomferra
 */
export class Panel extends React.PureComponent<IPanelProps> {

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return null;
    }
}

