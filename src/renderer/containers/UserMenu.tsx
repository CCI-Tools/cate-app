import * as React from 'react';
import { connect, Dispatch } from "react-redux";
import { useKeycloak } from '@react-keycloak/web';
import { Menu, MenuItem } from '@blueprintjs/core';

import { State } from '../state';
import * as actions from '../actions';

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IUserMenuProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IUserMenuProps {
    return {};
}

// noinspection JSUnusedLocalSymbols
const _UserMenu: React.FC<IUserMenuProps & IDispatch> = (props) => {
    const [keycloak, keycloakInitialized] = useKeycloak();

    const handleAccount = () => {
        actions.manageAccount(keycloak);
    };

    const handleLogout = () => {
        actions.logout(keycloak);
    };

    const disabled = !(keycloakInitialized && keycloak.authenticated);

    return (
        <div>
            <Menu>
                <MenuItem
                    text="Account"
                    icon="user"
                    onClick={handleAccount}
                    disabled={disabled}
                />
                <MenuItem
                    text="Logout"
                    icon="log-out"
                    onClick={handleLogout}
                    disabled={disabled}
                />
            </Menu>
        </div>
    );
}

const UserMenu = connect(mapStateToProps)(_UserMenu);
export default UserMenu
