import * as React from 'react';
import { connect } from 'react-redux';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import MatomoTracker from '@datapunt/matomo-tracker-js';

import { State } from '../state';
import AppMainPage from './AppMainPage';


interface IAppMainPageWrapperProps {
    trackingConsentObtained: boolean;
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppMainPageWrapperProps {
    return {
        trackingConsentObtained: state.session.trackingConsentObtained,
    };
}

const AppMainPageWrapper: React.FC<IAppMainPageWrapperProps> = (
    {
        trackingConsentObtained,
    }
) => {

    const [matomoInstance, setMatomoInstance] = React.useState<MatomoTracker | null>(null);

    React.useEffect(() => {
        if (matomoInstance === null) {
            const instance = createInstance(
                {
                    urlBase: 'https://matomo-ext.esa.int/',
                    siteId: 8,
                    // userId: userId, // optional, default value: `undefined`.
                    // trackerUrl: 'https://LINK.TO.DOMAIN/tracking.php', // optional, default value: `${urlBase}matomo.php`
                    // srcUrl: 'https://LINK.TO.DOMAIN/tracking.js', // optional, default value: `${urlBase}matomo.js`
                    disabled: !trackingConsentObtained, // optional, false by default. Makes all tracking calls no-ops if set to true.
                    heartBeat: { // optional, enabled by default
                        active: true, // optional, default value: true
                        seconds: 10 // optional, default value: `15
                    },
                    linkTracking: false, // optional, default value: true
                    configurations: { // optional, default value: {}
                        // any valid matomo configuration, all below are optional
                        disableCookies: !trackingConsentObtained,
                        setSecureCookie: true,
                        setRequestMethod: 'POST'
                    }
                }
            );
            setMatomoInstance(instance);
        }
    }, [trackingConsentObtained, matomoInstance]);

    return (
        <MatomoProvider value={matomoInstance}>
            <AppMainPage/>
        </MatomoProvider>
    );
};

export default connect(mapStateToProps)(AppMainPageWrapper);
