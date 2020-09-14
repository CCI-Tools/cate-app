import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { ReactKeycloakInjectedProps, withKeycloak } from '@react-keycloak/web';
import { connect, Dispatch } from "react-redux";
import { Menu, MenuItem } from '@blueprintjs/core';

import * as actions from '../actions';
import { State } from '../state';

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
const _UserMenu: React.FC<IUserMenuProps & IDispatch & ReactKeycloakInjectedProps> = (
    {
        dispatch,
        keycloak,
        keycloakInitialized,
    }
) => {
    const history = useHistory();

    const handleAccount = () => {
        dispatch(actions.manageAccount(keycloak) as any);
    };

    const handleLogout = () => {
        dispatch(actions.logout(keycloak, history) as any);
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

const UserMenu = connect(mapStateToProps)(withKeycloak<'native'>(_UserMenu));
export default UserMenu
