/* @flow */

import { BUTTON_LAYOUT, BUTTON_STYLE_OPTIONS } from '../constants';
import { determineEligibleFunding, determineEligibleCards } from '../funding';
import { memoize } from '../lib/util';

import { getButtonConfig, labelToFunding } from './config';

function parseLocale(locale : string) : LocaleType {
    let [ lang, country ] = locale.split('_');
    return { country, lang };
}

export function determineMaxButtons({ label, layout, max } : { layout : string, label : string, max : number }) : number {

    let allowed = (layout === BUTTON_LAYOUT.HORIZONTAL)
        ? getButtonConfig(label, 'allowPrimaryHorizontal')
        : getButtonConfig(label, 'allowPrimaryVertical');

    if (!allowed) {
        return 1;
    }

    let configMax = (layout === BUTTON_LAYOUT.HORIZONTAL)
        ? getButtonConfig(label, 'maxHorizontalButtons')
        : getButtonConfig(label, 'maxVerticalButtons');

    return max
        ? Math.min(configMax, max)
        : configMax;
}

function enableTagline({ tagline, branding, fundingicons, layout }) : boolean {
    return Boolean(tagline && branding && !fundingicons && layout === BUTTON_LAYOUT.HORIZONTAL);
}

export let normalizeProps = memoize((props : Object) : Object => {

    let {
        env,
        locale  = getButtonConfig('DEFAULT', 'defaultLocale'),
        style   = {},
        funding
    } = props;

    locale = parseLocale(locale);

    funding = funding || {};
    funding.allowed = funding.allowed || [];
    funding.disallowed = funding.disallowed || [];
    funding.remembered = funding.remembered || [];

    let label  = style[BUTTON_STYLE_OPTIONS.LABEL] || getButtonConfig('DEFAULT', (style.layout === BUTTON_LAYOUT.VERTICAL) ? 'defaultVerticalLabel' : 'defaultLabel');
    let layout = style[BUTTON_STYLE_OPTIONS.LAYOUT] || getButtonConfig(label, 'defaultLayout');

    let {
        [ BUTTON_STYLE_OPTIONS.SIZE ]:         size         = getButtonConfig(label, (layout === BUTTON_LAYOUT.VERTICAL) ? 'defaultVerticalSize' : 'defaultSize'),
        [ BUTTON_STYLE_OPTIONS.COLOR ]:        color        = getButtonConfig(label, 'defaultColor'),
        [ BUTTON_STYLE_OPTIONS.SHAPE ]:        shape        = getButtonConfig(label, 'defaultShape'),
        [ BUTTON_STYLE_OPTIONS.BRANDING ]:     branding     = getButtonConfig(label, (layout === BUTTON_LAYOUT.VERTICAL) ? 'defaultVerticalBranding' : 'defaultBranding'),
        [ BUTTON_STYLE_OPTIONS.FUNDINGICONS ]: fundingicons = getButtonConfig(label, 'defaultFundingIcons'),
        [ BUTTON_STYLE_OPTIONS.TAGLINE ]:      tagline      = getButtonConfig(label, 'defaultTagline'),
        [ BUTTON_STYLE_OPTIONS.MAXBUTTONS ]:   max,
        [ BUTTON_STYLE_OPTIONS.HEIGHT ]:       height
    } = style;

    max = determineMaxButtons({ label, layout, max });

    let selected = labelToFunding(label);
    let sources  = determineEligibleFunding({ funding, selected, locale, env, layout }).slice(0, max);
    let multiple = sources.length > 1;

    if (multiple) {
        branding = true;
    }

    tagline = enableTagline({ tagline, branding, fundingicons, layout });

    let cards = determineEligibleCards({ funding, locale });

    return { size, label, locale, color, shape, branding, fundingicons,
        tagline, funding, layout, sources, max, multiple, env, height, cards };
});
