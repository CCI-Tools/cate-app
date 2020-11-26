import * as Cookies from 'js-cookie';

const C_COOKIE_CONSENT_OBTAINED = 'cookieConsentObtained';
const C_TRACKING_CONSENT_OBTAINED = 'trackingConsentObtained';

const C_ON = '1';
const C_OFF = '0';
const C_OPTIONS: Cookies.CookieAttributes = {expires: 365};


export function isCookieConsentObtained() : boolean {
    return Cookies.get(C_COOKIE_CONSENT_OBTAINED) === C_ON;
}

export function isTrackingConsentObtained() : boolean {
    return Cookies.get(C_TRACKING_CONSENT_OBTAINED) === C_ON;
}

export function storeCookieConsent(trackingConsentObtained: boolean) {
    Cookies.set(C_COOKIE_CONSENT_OBTAINED, C_ON, C_OPTIONS);
    Cookies.set(C_TRACKING_CONSENT_OBTAINED, trackingConsentObtained ? C_ON : C_OFF, C_OPTIONS);
}
