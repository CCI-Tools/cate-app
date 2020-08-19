import * as React from 'react';


const LONG_ID_STYLE: React.CSSProperties = {wordWrap: 'break-word'};

export interface ILongIdLabelProps {
    label: string;
    longId: string;
}

const LongIdLabel = ({label, longId}: ILongIdLabelProps) => {
    return (
        <React.Fragment>
            <p>{label}</p>
            <div style={LONG_ID_STYLE}><strong>{longId}</strong></div>
        </React.Fragment>
    );
};

export default LongIdLabel;