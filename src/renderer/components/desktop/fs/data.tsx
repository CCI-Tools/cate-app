import * as React from 'react';
import { Classes, Icon, Intent, Position, Tooltip } from '@blueprintjs/core';

import { IFileNode } from './types';


const DATA: IFileNode[] = [
    {
        id: 0,
        hasCaret: true,
        icon: "folder-close",
        label: "Folder 0",
        nodeData: {
            name: "Folder 0",
            size: 230983,
            isDirectory: true,
            isFile: false,
            lastModified: "2020-07-01 10:42:12"
        }
    },
    {
        id: 1,
        icon: "folder-close",
        isExpanded: true,
        label: (
            <Tooltip content="I'm a folder <3" position={Position.RIGHT}>
                Folder 1
            </Tooltip>
        ),
        childNodes: [
            {
                id: 2,
                icon: "document",
                label: "Item 0",
                secondaryLabel: (
                    <Tooltip content="An eye!">
                        <Icon icon="eye-open"/>
                    </Tooltip>
                ),
                nodeData: {
                    name: "Item 0",
                    size: 7654,
                    isDirectory: false,
                    isFile: true,
                    lastModified: "2020-07-01 10:42:12"
                },
            },
            {
                id: 3,
                icon: <Icon icon="tag" intent={Intent.PRIMARY} className={Classes.TREE_NODE_ICON}/>,
                label: "Organic meditation gluten-free, sriracha VHS drinking vinegar beard man.",
                nodeData: {
                    name: "Organic meditation gluten-free, sriracha VHS drinking vinegar beard man.",
                    size: 6456,
                    isDirectory: false,
                    isFile: true,
                    lastModified: "2020-07-01 10:42:12"
                },
            },
            {
                id: 4,
                hasCaret: true,
                icon: "folder-close",
                label: (
                    <Tooltip content="foo" position={Position.RIGHT}>
                        Folder 2
                    </Tooltip>
                ),
                childNodes: [
                    {
                        id: 5,
                        label: "No-Icon Item",
                        nodeData: {
                            name: "No-Icon Item",
                            size: 234,
                            isDirectory: false,
                            isFile: true,
                            lastModified: "2020-07-01 10:42:12"
                        }
                    },
                    {
                        id: 6,
                        icon: "tag",
                        label: "Item 1",
                        nodeData: {
                            name: "Item 1",
                            size: 634,
                            isDirectory: false,
                            isFile: true,
                            lastModified: "2020-07-01 10:42:12"
                        }
                    },
                    {
                        id: 7,
                        hasCaret: true,
                        icon: "folder-close",
                        label: "Folder 3",
                        childNodes: [
                            {
                                id: 8, icon: "document", label: "Item 0",
                                nodeData: {
                                    name: "Item 0",
                                    size: 23423,
                                    isDirectory: false,
                                    isFile: true,
                                    lastModified: "2020-07-01 10:42:12"
                                }
                            },
                            {
                                id: 9, icon: "tag", label: "Item 1",
                                nodeData: {
                                    name: "Item 1",
                                    size: 6346,
                                    isDirectory: false,
                                    isFile: true,
                                    lastModified: "2020-07-01 10:42:12"
                                }
                            },
                        ],
                        nodeData: {
                            name: "Folder 3",
                            size: 6345345,
                            isDirectory: true,
                            isFile: false,
                            lastModified: "2020-07-01 10:42:12"
                        }
                    },
                ],
                nodeData: {
                    name: "Folder 2",
                    size: 534743,
                    isDirectory: true,
                    isFile: false,
                    lastModified: "2020-07-01 10:42:12"
                },
            },
        ],
        nodeData: {
            name: "Folder 1",
            size: 2313423,
            isDirectory: true,
            isFile: false,
            lastModified: "2020-07-01 10:42:12"
        }
    },
    {
        id: 10,
        hasCaret: true,
        icon: "folder-close",
        label: "Super secret files",
        disabled: true,
        nodeData: {
            name: "Super secret files",
            size: 53452345,
            isDirectory: true,
            isFile: false,
            lastModified: "2020-07-01 10:42:12"
        }
    },

];

export default DATA;