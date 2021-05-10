import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGFM from 'remark-gfm';
import { Colors } from '@blueprintjs/core';

const CODE_STYLE = {
    fontFamily: 'Source Code Pro, Consolas, monospace',
    color: Colors.LIGHT_GRAY1,
};

const MARKDOWN_COMPONENTS = {
    em: ({node, ...props}) => <em className="user-selectable" {...props}/>,
    li: ({node, ...props}) => <li className="user-selectable" {...props}/>,
    p: ({node, ...props}) => <p className="user-selectable" {...props}/>,
    span: ({node, ...props}) => <span className="user-selectable" {...props}/>,
    div: ({node, ...props}) => <div className="user-selectable" {...props}/>,
    code: ({node, ...props}) => <code className="user-selectable" style={CODE_STYLE} {...props}/>,
    pre: ({node, ...props}) => <pre className="user-selectable" style={CODE_STYLE} {...props}/>,
};

interface IMarkdownProps {
    source: string;
}

const Markdown: React.FC<IMarkdownProps> = ({source}) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGFM]}
            components={MARKDOWN_COMPONENTS}
            linkTarget='_blank'
        >
            {source}
        </ReactMarkdown>
    );
}


export default Markdown;
