import * as React from 'react';
import { Button, Collapse } from '@blueprintjs/core';

const CONTAINER_STYLE: React.CSSProperties = {
    marginTop: '0.75em',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
};

const DETAILS_STYLE: React.CSSProperties = {
    overflow: 'auto',
};


interface IMessageDetailsProps {
    details: string;
    onCopyDetails?: (details: string) => any;
    width?: number | string;
    height?: number | string;
}

const MessageDetails: React.FC<IMessageDetailsProps> = ({
                                                            details,
                                                            onCopyDetails,
                                                            width,
                                                            height
                                                        }) => {

    const [showDetails, setShowDetails] = React.useState(false);
    return (
        <div style={CONTAINER_STYLE}>
            <div>
                {onCopyDetails && (
                    <Button
                        onClick={() => onCopyDetails(details)}
                        icon={'clipboard'}
                        small={true}
                        style={{marginRight: 6}}
                    />
                )}
                <Button
                    onClick={() => setShowDetails(!showDetails)}
                    rightIcon={showDetails ? 'chevron-up' : 'chevron-down'}
                    small={true}
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
            </div>
            <Collapse
                isOpen={showDetails}
            >
                <pre className="user-selectable"
                     style={{
                         ...DETAILS_STYLE,
                         width: width || '32em',
                         height: height || '20em'
                     }}
                >
                    {details}
                </pre>
            </Collapse>
        </div>
    );
};

export default MessageDetails;
