import * as React from 'react';
import { Button, Checkbox, Classes, Collapse, Drawer, Intent, Position } from '@blueprintjs/core';
import { connect, Dispatch } from 'react-redux';
import { State } from '../state';
import { obtainCookieConsent } from '../actions';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IGdprBannerProps {
    cookieConsentObtained: boolean;
    trackingConsentObtained: boolean;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IGdprBannerProps {
    return {
        cookieConsentObtained: state.session.cookieConsentObtained,
        trackingConsentObtained: state.session.trackingConsentObtained,
    };
}

const GdprBanner: React.FC<IGdprBannerProps & IDispatch> = (
    {
        cookieConsentObtained,
        trackingConsentObtained,
        dispatch,
    }
) => {
    const [customizeMode, setCustomizeMode] = React.useState(false);
    const [trackingAllowed, setTrackingAllowed] = React.useState(trackingConsentObtained);

    if (cookieConsentObtained) {
        return null;
    }

    const handleConsent = () => {
        dispatch(obtainCookieConsent(customizeMode ? trackingAllowed : true));
    };

    const handleTrackingAllowed = (e: React.FormEvent<HTMLInputElement>) => {
        setTrackingAllowed(e.currentTarget.checked);
    };

    return (
        <Drawer
            title="Data Protection Notice"
            icon="info-sign"
            position={Position.BOTTOM}
            isOpen={true}
            isCloseButtonShown={false}
            canOutsideClickClose={false}
            canEscapeKeyClose={false}
            size={240}
        >
            <div className={Classes.DRAWER_BODY}>
                <div className={Classes.DIALOG_BODY}>
                    We use cookies so you can optimally use this website.
                    Some cookies that are necessary for the operation of Cate App.
                    In addition, we use cookies for statistical purposes.
                    You can adjust the data protection settings or agree to all cookies
                    directly. <a href='https://climate.esa.int/en/privacy/'>Privacy Statement</a>
                </div>

                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button
                            intent={Intent.PRIMARY}
                            onClick={handleConsent}
                        >
                            {customizeMode ? "I agree to selected Cookies" : "I agree to all Cookies"}
                        </Button>
                        <Button
                            rightIcon={customizeMode ? 'caret-up' : 'caret-down'}
                            onClick={() => setCustomizeMode(!customizeMode)}
                        >
                            Settings
                        </Button>
                    </div>
                </div>

                <Collapse isOpen={customizeMode}>
                    <div className={Classes.DIALOG_BODY}>
                        <Checkbox
                            checked={true}
                        >
                            <strong>Functional</strong>: Cate does not work without functional cookies.
                            We'll just save your consent with this notice and possibly auto-login information
                            if you use the Cate cloud services.
                        </Checkbox>
                        <Checkbox
                            checked={trackingAllowed}
                            onChange={handleTrackingAllowed}
                        >
                            <strong>Tracking</strong>: Cate uses the open source software
                            tool <a href="https://matomo.org/">Matomo</a>, which uses cookies.
                            With these cookies we count Cate App visits - of course anonymously.
                            Matomo fully complies to the EU General Data Protection Regulation (GDPR).
                        </Checkbox>
                    </div>
                </Collapse>
            </div>
        </Drawer>
    );
}

export default connect(mapStateToProps)(GdprBanner);
