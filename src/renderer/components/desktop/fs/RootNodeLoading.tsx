import * as React from 'react';
import { Spinner } from "@blueprintjs/core";

import { FileNode } from './FileNode';


export interface IRootNodeLoadingProps {
    rootNode: FileNode;
}

const RootNodeLoading: React.FC<IRootNodeLoadingProps> = ({rootNode}) => {
    if (!rootNode.childNodes) {
        return (
            <div style={{width: '100%', height: '100%'}}><Spinner size={32}/></div>
        );
    }
    return null;
}

export default RootNodeLoading;



