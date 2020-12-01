import { Menu, MenuItem } from '@blueprintjs/core';
import * as React from 'react';
import { connect, Dispatch } from "react-redux";

import { State } from '../state';

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IHelpMenuProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IHelpMenuProps {
    return {};
}

const _HelpMenu: React.FC<IHelpMenuProps & IDispatch> = () => {

    const openUrl = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div>
            <Menu>
                <MenuItem
                    text="Cate Documentation"
                    onClick={() => openUrl("http://cate.readthedocs.io")}
                />
                <MenuItem
                    text="Cate Website"
                    onClick={() => openUrl("https://climate.esa.int/en/explore/analyse-climate-data")}
                />
                <MenuItem
                    text="Cate on GitHub"
                    onClick={() => openUrl("https://github.com/CCI-Tools/cate")}
                />
                <MenuItem
                    text="ESA Climate Office Helpdesk"
                    onClick={() => openUrl("https://climate.esa.int/en/helpdesk")}
                />
            </Menu>
        </div>
    )
}

const HelpMenu = connect(mapStateToProps)(_HelpMenu)
export default HelpMenu
