import * as React from 'react';
import { Button, Checkbox, Classes, Collapse, Drawer, Intent, Position } from '@blueprintjs/core';
import * as Cookies from 'js-cookie';

const COOKIE_CONSENT = 'cookieConsent';
const TRACKING_ALLOWED = 'trackingAllowed';

const C_ON = '1';
const C_OFF = '0';
const C_OPTIONS: Cookies.CookieAttributes = {expires: 365};

function setConsentCookies(trackingAllowed: boolean) {
    Cookies.set(COOKIE_CONSENT, C_ON, C_OPTIONS);
    Cookies.set(TRACKING_ALLOWED, trackingAllowed ? C_ON : C_OFF, C_OPTIONS);
}

const GdprBanner: React.FC = () => {
    return (Cookies.get(COOKIE_CONSENT) === C_ON) ? null : <GdprBannerCore/>;
}

export default GdprBanner;

const GdprBannerCore: React.FC = () => {
    const [customizeMode, setCustomizeMode] = React.useState(false);
    const [trackingAllowed, setTrackingAllowed] = React.useState(false);
    const [consent, setConsent] = React.useState(false);

    if (consent) {
        return null;
    }

    const handleConsent = () => {
        setConsentCookies(customizeMode ? trackingAllowed : true);
        setConsent(true);
    }

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
                            onChange={(e) => setTrackingAllowed(e.currentTarget.checked)}
                        >
                            <strong>Tracking</strong>: Cate uses the open source software
                            tool <a href="https://matomo.org/">Matomo</a>, which uses cookies.
                            With these cookies we can count your Cate App visits.
                            Matomo fully complies to the EU General Data Protection Regulation (GDPR).
                        </Checkbox>
                    </div>
                </Collapse>
            </div>
        </Drawer>
    );
}


