import * as React from 'react';

export interface TermsAndConditionsProps {
    className?: string;
    style?: React.CSSProperties;
}

export function TermsAndConditions({className, style}: TermsAndConditionsProps) {
    return (
        <a
            className={className}
            style={style}
            href="https://climate.esa.int/en/terms-and-conditions/"
            target="_blank"
            rel="noopener noreferrer"
        >
            Terms & Conditions
        </a>
    );
}
