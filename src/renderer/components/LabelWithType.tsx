import * as React from 'react';
import { Tooltip } from '@blueprintjs/core';
import { formatDataTypeName } from '../../common/format';

const DATA_TYPE_STYLE: React.CSSProperties = {color: 'rgba(0,255,0,0.8)', fontSize: '0.8em'};
const TOOLTIP_STYLE: React.CSSProperties = {width: "15em"};

export interface ILabelWithTypeProps {
    label: string;
    dataType: string | null;
    fullyQualified?: boolean;
    units?: string;
    tooltipText?: string;
    em?: boolean;
    style?: { [cssProperty: string]: any; }
}

/**
 * A label with a data type and optional units and tooltip text.
 *
 * @author Norman Fomferra
 */
export const LabelWithType: React.FC<ILabelWithTypeProps> = (
    {
        label,
        units,
        dataType,
        fullyQualified,
        tooltipText,
        em,
        style,
    }) => {

    const labelText = label;
    const dataTypeText = formatDataTypeName(dataType, fullyQualified);
    const unitsText = units && units !== '' ? ` (${units})` : '';

    let content = (
        <span>{em ? <em>{labelText}</em> : labelText} {unitsText} <span
            style={DATA_TYPE_STYLE}>{dataTypeText} </span></span>
    );

    if (tooltipText && tooltipText !== '') {
        content = (
            <Tooltip
                content={<div style={TOOLTIP_STYLE}>{tooltipText}</div>}
                position={'top'}
            >
                {content}
            </Tooltip>
        );
    }

    return <span style={style}>{content}</span>;
}


