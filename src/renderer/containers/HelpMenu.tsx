import { Menu, MenuItem } from '@blueprintjs/core';
import * as React from 'react';
import { connect, Dispatch } from "react-redux";

import { State } from '../state';

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IHelpMenuProps {
}

function mapStateToProps(state: State): IHelpMenuProps {
    return {};
}

const _HelpMenu: React.FC<IHelpMenuProps & IDispatch> = (props) => {

    const openUrl = (url: string) => {
        window.open(url, '_blank');
    }

    return (
        <div>
            <Menu>
                {/*<MenuItem */}
                {/*    text="Website"*/}
                {/*    onClick={() => openUrl("https://climatetoolbox.io/")}*/}
                {/*/>*/}
                <MenuItem
                    text="Cate Documentation"
                    onClick={() => openUrl("http://cate.readthedocs.io/")}
                />
                {/*<MenuItem */}
                {/*    text="Downloads"*/}
                {/*    onClick={() => openUrl("https://github.com/CCI-Tools/cate/releases")}*/}
                {/*/>*/}
                <MenuItem
                    text="Cate Issue Tracker"
                    onClick={() => openUrl("https://github.com/CCI-Tools/cate-webui/issues")}
                />
                {/*<MenuItem*/}
                {/*    text="User Survey"*/}
                {/*    onClick={() => openUrl("https://github.com/CCI-Tools/cate-webui/issues")}*/}
                {/*/>*/}
                <MenuItem
                    text="ESA Climate Office"
                    onClick={() => openUrl("https://climate.esa.int/")}
                />
            </Menu>
        </div>
    )
}

const HelpMenu = connect(mapStateToProps)(_HelpMenu)
export default HelpMenu
