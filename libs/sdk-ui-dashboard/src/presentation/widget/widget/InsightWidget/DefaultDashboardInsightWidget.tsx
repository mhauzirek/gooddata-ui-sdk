// (C) 2020-2024 GoodData Corporation
import React, { useMemo, useCallback } from "react";
import cx from "classnames";
import { useIntl } from "react-intl";
import { IInsight, widgetTitle, insightVisualizationType } from "@gooddata/sdk-model";
import { VisType } from "@gooddata/sdk-ui";
import {
    isInsightAlertingConfigurationEnabled,
    isInsightScheduledExportsConfigurationEnabled,
    isInsightSupportedForAlerts,
    isInsightSupportedForScheduledExports,
} from "@gooddata/sdk-ui-ext";
import {
    useDashboardSelector,
    selectSettings,
    isCustomWidget,
    useDashboardScheduledEmails,
} from "../../../../model/index.js";
import {
    DashboardItem,
    DashboardItemHeadline,
    DashboardItemVisualization,
    getVisTypeCssClass,
} from "../../../presentationComponents/index.js";
import { DashboardInsight } from "../../insight/index.js";
import { useInsightExport } from "../../common/index.js";
import { useDashboardComponentsContext } from "../../../dashboardContexts/index.js";
import { InsightWidgetDescriptionTrigger } from "../../description/InsightWidgetDescriptionTrigger.js";

import { useInsightMenu } from "./useInsightMenu.js";
import { DashboardWidgetInsightGuard } from "./DashboardWidgetInsightGuard.js";
import { IDefaultDashboardInsightWidgetProps } from "./types.js";
import { AlertingDisabledReason, SchedulingDisabledReason } from "../../insightMenu/index.js";

export const DefaultDashboardInsightWidget: React.FC<Omit<IDefaultDashboardInsightWidgetProps, "insight">> = (
    props,
) => {
    return <DashboardWidgetInsightGuard {...props} Component={DefaultDashboardInsightWidgetCore} />;
};

/**
 * @internal
 */
const DefaultDashboardInsightWidgetCore: React.FC<
    IDefaultDashboardInsightWidgetProps & { insight: IInsight }
> = ({ widget, insight, screen, onError, onExportReady, onLoadingChanged, dashboardItemClasses }) => {
    const intl = useIntl();
    const settings = useDashboardSelector(selectSettings);

    const {
        onScheduleEmailingOpen,
        onScheduleEmailingManagementOpen,
        isScheduledEmailingVisible,
        isScheduledManagementEmailingVisible,
        numberOfAvailableDestinations,
    } = useDashboardScheduledEmails();

    const visType = insightVisualizationType(insight) as VisType;
    const { ref: widgetRef } = widget;

    const { exportCSVEnabled, exportXLSXEnabled, onExportCSV, onExportXLSX } = useInsightExport({
        widgetRef,
        title: widgetTitle(widget) || intl.formatMessage({ id: "export.defaultTitle" }),
        insight,
    });

    const onScheduleExport = useCallback(() => {
        onScheduleEmailingOpen(widget);
    }, [onScheduleEmailingOpen, widget]);

    const onScheduleManagementExport = useCallback(() => {
        onScheduleEmailingManagementOpen(widget);
    }, [onScheduleEmailingManagementOpen, widget]);

    const isStandardWidget = !isCustomWidget(widget);
    const hasNoDestinations = numberOfAvailableDestinations === 0;

    //NOTE: Check if widget has localIdentifier, if not that is probably widget from old dashboard
    // and we should not allow to schedule export/alert because we need localIdentifier to identify the widget
    const widgetHasNoLocalIdentifier = !widget.localIdentifier;

    const isAlertingEnabled = settings.enableAlerting === true;
    const isInsightTypeSupportedForAlerting = isInsightSupportedForAlerts(insight);
    const isInsightEnabledForAlerting = isInsightAlertingConfigurationEnabled(insight);
    const isAlertingVisible = isAlertingEnabled && isStandardWidget && isInsightTypeSupportedForAlerting;
    const alertingDisabled = hasNoDestinations || !isInsightEnabledForAlerting || widgetHasNoLocalIdentifier;
    let alertingDisabledReason: AlertingDisabledReason | undefined = undefined;
    if (widgetHasNoLocalIdentifier) {
        alertingDisabledReason = "oldWidget";
    } else if (hasNoDestinations) {
        alertingDisabledReason = "noDestinations";
    } else if (!isInsightEnabledForAlerting) {
        alertingDisabledReason = "disabledOnInsight";
    }

    const isInsightTypeSupportedForScheduling = isInsightSupportedForScheduledExports(insight);
    const isInsightEnabledForScheduling = isInsightScheduledExportsConfigurationEnabled(insight);
    const scheduleExportDisabled =
        !isInsightTypeSupportedForScheduling ||
        !isStandardWidget ||
        !isInsightEnabledForScheduling ||
        widgetHasNoLocalIdentifier;
    const scheduleExportManagementDisabled = !isStandardWidget;
    let scheduleExportDisabledReason: SchedulingDisabledReason | undefined = undefined;
    if (widgetHasNoLocalIdentifier) {
        scheduleExportDisabledReason = "oldWidget";
    } else if (!isStandardWidget) {
        scheduleExportDisabledReason = "incompatibleWidget";
    } else if (!isInsightEnabledForScheduling || !isInsightTypeSupportedForScheduling) {
        scheduleExportDisabledReason = "disabledOnInsight";
    }

    ///
    const { closeMenu, isMenuOpen, menuItems, openMenu } = useInsightMenu({
        insight,
        widget,
        exportCSVEnabled,
        exportXLSXEnabled,
        onExportCSV,
        onExportXLSX,
        onScheduleExport,
        onScheduleManagementExport,
        isScheduleExportVisible: isScheduledEmailingVisible,
        isScheduleExportManagementVisible: isScheduledManagementEmailingVisible,
        isAlertingVisible,
        alertingDisabled,
        alertingDisabledReason,
        scheduleExportDisabled,
        scheduleExportManagementDisabled,
        scheduleExportDisabledReason,
    });
    const toggleMenu = useCallback(() => {
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }, [isMenuOpen, closeMenu, openMenu]);

    const {
        InsightMenuButtonComponentProvider,
        InsightMenuComponentProvider,
        ErrorComponent,
        LoadingComponent,
    } = useDashboardComponentsContext();

    const InsightMenuButtonComponent = useMemo(
        () => InsightMenuButtonComponentProvider(insight, widget),
        [InsightMenuButtonComponentProvider, insight, widget],
    );

    const InsightMenuComponent = useMemo(
        () => InsightMenuComponentProvider(insight, widget),
        [InsightMenuComponentProvider, insight, widget],
    );

    return (
        <DashboardItem
            className={cx(
                dashboardItemClasses,
                "type-visualization",
                "gd-dashboard-view-widget",
                getVisTypeCssClass(widget.type, visType),
            )}
            screen={screen}
        >
            <DashboardItemVisualization
                renderHeadline={(clientHeight) =>
                    !widget.configuration?.hideTitle && (
                        <DashboardItemHeadline title={widget.title} clientHeight={clientHeight} />
                    )
                }
                renderBeforeVisualization={() => (
                    <div className="gd-absolute-row">
                        {settings?.enableDescriptions ? (
                            <InsightWidgetDescriptionTrigger
                                insight={insight}
                                widget={widget}
                                screen={screen}
                            />
                        ) : null}
                        <InsightMenuButtonComponent
                            insight={insight}
                            widget={widget}
                            isOpen={isMenuOpen}
                            onClick={toggleMenu}
                            items={menuItems}
                        />
                    </div>
                )}
                renderAfterContent={() => {
                    if (!isMenuOpen) {
                        return null;
                    }

                    return (
                        <InsightMenuComponent
                            insight={insight}
                            widget={widget}
                            isOpen={isMenuOpen}
                            onClose={closeMenu}
                            items={menuItems}
                        />
                    );
                }}
            >
                {({ clientHeight, clientWidth }) => (
                    <DashboardInsight
                        clientHeight={clientHeight}
                        clientWidth={clientWidth}
                        insight={insight}
                        widget={widget}
                        onExportReady={onExportReady}
                        onLoadingChanged={onLoadingChanged}
                        onError={onError}
                        ErrorComponent={ErrorComponent}
                        LoadingComponent={LoadingComponent}
                    />
                )}
            </DashboardItemVisualization>
        </DashboardItem>
    );
};
