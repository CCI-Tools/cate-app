import * as React from 'react';
import { Classes, Tree } from "@blueprintjs/core";
import { modifyAllNodes, modifySingleNode } from './node';

import { IFileNode } from './types';
import INITIAL_STATE from './data';


export interface IFileTreeProps {
}

const FileTree: React.FC<IFileTreeProps> = (props) => {
    const [nodes, setNodes] = React.useState<IFileNode[]>(INITIAL_STATE);

    const handleNodeClick = (nodeData: IFileNode, _nodePath: number[], e: React.MouseEvent<HTMLElement>) => {
        const originallySelected = nodeData.isSelected;
        let newNodes = nodes;
        if (!e.shiftKey) {
            newNodes = modifyAllNodes(nodes, {isSelected: false});
            console.log('cleared selection', newNodes);
        }
        nodeData.isSelected = !originallySelected;
        setNodes(modifySingleNode(newNodes, nodeData));
    };

    const handleNodeCollapse = (nodeData: IFileNode) => {
        nodeData.isExpanded = false;
        setNodes(modifySingleNode(nodes, nodeData));
    };

    const handleNodeExpand = (nodeData: IFileNode) => {
        nodeData.isExpanded = true;
        setNodes(modifySingleNode(nodes, nodeData));
    };

    return (
        <Tree
            contents={nodes}
            onNodeClick={handleNodeClick}
            onNodeCollapse={handleNodeCollapse}
            onNodeExpand={handleNodeExpand}
        />
    );
}

export default FileTree;

