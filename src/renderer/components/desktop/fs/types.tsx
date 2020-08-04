import { ITreeNode } from '@blueprintjs/core';

export interface FileInfo {
    name: string;
    lastModified: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
}

export type IFileNode = ITreeNode<FileInfo>;