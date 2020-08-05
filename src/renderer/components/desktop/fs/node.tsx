import { ITreeNode } from '@blueprintjs/core';

export function modifyAllNodes<T>(nodes: ITreeNode<T>[], nodeModification: Partial<ITreeNode<T>>): ITreeNode<T>[] {
    return nodes.map(node => {
        let childNodes = node.childNodes;
        if (childNodes) {
            childNodes = modifyAllNodes<T>(childNodes, nodeModification);
        }
        return {...node, ...nodeModification, childNodes};
    });
}

export function findNode<T>(nodes: ITreeNode<T>[], predicate: (node: ITreeNode<T>) => boolean): ITreeNode<T> | undefined {
    const matchingNode = nodes.find(predicate);
    if (matchingNode) {
        return matchingNode;
    }
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.childNodes) {
            const matchingNode = findNode<T>(node.childNodes, predicate);
            if (matchingNode) {
                return matchingNode;
            }
        }
    }
}

export function filterNodes<T>(nodes: ITreeNode<T>[], predicate: (node: ITreeNode<T>, index: number) => boolean): ITreeNode<T>[] {
    const filteredNodes = [...nodes.filter(predicate)];
    for (let i = 0; i < filteredNodes.length; i++) {
        const filteredNode = filteredNodes[i];
        if (filteredNode.childNodes) {
            const filteredChildNodes = filterNodes<T>(filteredNode.childNodes, predicate);
            if (filteredChildNodes !== filteredNode.childNodes) {
                filteredNodes[i] = {...filteredNode, childNodes: filteredChildNodes};
            }
        }
    }
    return filteredNodes;
}

export function modifySingleNode<T>(nodes: ITreeNode<T>[], nodeId: string | number, nodeModification: Partial<ITreeNode<T>>): ITreeNode<T>[] {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === nodeId) {
            const nodesCopy = [...nodes];
            nodesCopy[i] = {...node, ...nodeModification};
            return nodesCopy;
        }
    }
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.childNodes) {
            const childNodes = modifySingleNode<T>(node.childNodes, nodeId, nodeModification);
            if (childNodes !== node.childNodes) {
                const nodesCopy = [...nodes];
                nodesCopy[i] = {...node, childNodes};
                return nodesCopy;
            }
        }
    }
    return nodes;
}
