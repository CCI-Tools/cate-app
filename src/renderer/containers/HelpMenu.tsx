import * as React from 'react';
import { connect, Dispatch } from "react-redux";
import { Menu, MenuItem } from '@blueprintjs/core';

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
                <MenuItem 
                    text="Website"
                    onClick={() => openUrl("https://climatetoolbox.io/")}
                />
                <MenuItem 
                    text="Documentation"
                    onClick={() => openUrl("http://cate.readthedocs.io/en/latest/")}
                />
                <MenuItem 
                    text="Downloads"
                    onClick={() => openUrl("https://github.com/CCI-Tools/cate/releases")}
                />
                <MenuItem 
                    text="Issue Tracker"
                    onClick={() => openUrl("https://github.com/CCI-Tools/cate/issues")}
                />
                <MenuItem 
                    text="ESA Climate Change Initiative"
                    onClick={() => openUrl("http://cci.esa.int/")}
                />
            </Menu>
        </div>
    )
}

const HelpMenu = connect(mapStateToProps)(_HelpMenu)
export default HelpMenu
