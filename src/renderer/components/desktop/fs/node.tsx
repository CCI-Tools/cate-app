import { ITreeNode } from '@blueprintjs/core';

export function modifyAllNodes<T>(nodes: ITreeNode<T>[], modifiedNode: Partial<ITreeNode<T>>): ITreeNode<T>[] {
    return nodes.map(node => {
        let childNodes = node.childNodes;
        if (childNodes) {
            childNodes = modifyAllNodes(childNodes, modifiedNode);
        }
        return {...node, ...modifiedNode, childNodes};
    });
}

export function modifySingleNode<T>(nodes: ITreeNode<T>[], modifiedNode: ITreeNode<T>): ITreeNode<T>[] {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node === modifiedNode || node.id === modifiedNode.id) {
            const nodesCopy = [...nodes];
            nodesCopy[i] = {...node, ...modifiedNode};
            return nodesCopy;
        }
    }
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.childNodes) {
            const childNodes = modifySingleNode(node.childNodes, modifiedNode);
            if (childNodes !== node.childNodes) {
                const nodesCopy = [...nodes];
                nodesCopy[i] = {...node, childNodes};
                return nodesCopy;
            }
        }
    }
    return nodes;
}
