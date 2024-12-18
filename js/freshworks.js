import { dataConfig } from '../../VAL_Web_Utilities/js/gbifDataConfig.js';

if (dataConfig.helpWidgetId) {
    window.fwSettings={'widget_id':dataConfig.helpWidgetId};
    !function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}()
    await import(`https://widget.freshworks.com/widgets/${dataConfig.helpWidgetId}.js`);
}