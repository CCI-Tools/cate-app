import { Menu, MenuItem } from '@blueprintjs/core';
import { ReactKeycloakInjectedProps, withKeycloak } from '@react-keycloak/web';
import * as React from 'react';
import { connect, Dispatch } from "react-redux";
import { useHistory } from 'react-router-dom';

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

    return (
        <div>
            <Menu>
                <MenuItem
                    text="Account"
                    icon="user"
                    onClick={handleAccount}
                    disabled={!keycloakInitialized}
                />
                <MenuItem
                    text="Logout"
                    icon="log-out"
                    onClick={handleLogout}
                    disabled={!keycloakInitialized}
                />
            </Menu>
        </div>
    );
}

const UserMenu = connect(mapStateToProps)(withKeycloak<'native'>(_UserMenu));
export default UserMenu;
