import * as React from 'react';
import { connect } from 'react-redux';

import { Intent, Tag } from '@blueprintjs/core';
import { CATE_APP_VERSION } from '../../config';
import { State } from '../state';


interface IVersionTagsOwnProps {
    minimal?: boolean;
}

interface IVersionTagsProps extends IVersionTagsOwnProps {
    uiVersion: string;
    apiVersion: string | null;
}

function mapStateToProps(state: State, ownProps: IVersionTagsOwnProps): IVersionTagsProps {
    let serviceInfo = state.communication.webAPIServiceInfo;
    return {
        uiVersion: CATE_APP_VERSION,
        apiVersion: serviceInfo ? serviceInfo.version : null,
        minimal: ownProps.minimal,
    };
}

const VersionTags: React.FC<IVersionTagsProps> = ({
                                                      uiVersion,
                                                      apiVersion,
                                                      minimal,
                                                  }) => {
    return (
        <div>
            <VersionTag
                label="Cate UI"
                version={uiVersion}
                minimal={minimal}
            />
            {apiVersion &&
             <>
                 &nbsp;
                 <VersionTag
                     label="Cate API"
                     version={apiVersion}
                     minimal={minimal}
                 />
             </>}
        </div>
    );
}

export default connect(mapStateToProps)(VersionTags);


interface IVersionTagProps {
    label: string;
    version: string;
    minimal?: boolean;
}


const VersionTag: React.FC<IVersionTagProps> = (
    {
        label,
        version,
        minimal
    }
) => {
    const isDevVersion = version.includes('dev');
    const intent = isDevVersion ? Intent.WARNING : Intent.NONE;
    return (
        <Tag
            intent={intent}
            round={true}
            minimal={minimal}
        >
            {label}&nbsp;{version}
        </Tag>
    );
}

