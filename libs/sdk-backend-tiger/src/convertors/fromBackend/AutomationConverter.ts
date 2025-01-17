// (C) 2024 GoodData Corporation
import {
    ComparisonWrapper,
    RangeWrapper,
    RelativeWrapper,
    JsonApiAutomationInAttributesAlert,
    JsonApiAutomationOutAttributesStateEnum,
    JsonApiAutomationOutIncludes,
    JsonApiAutomationOutList,
    JsonApiAutomationOutWithLinks,
    JsonApiExportDefinitionOutWithLinks,
    JsonApiUserLinkage,
    JsonApiUserOutWithLinks,
} from "@gooddata/api-client-tiger";
import {
    IAlertComparisonOperator,
    IAutomationAlert,
    IAutomationMetadataObject,
    IAutomationRecipient,
    idRef,
    isAutomationUserRecipient,
} from "@gooddata/sdk-model";
import { convertExportDefinitionMdObject as convertExportDefinitionMdObjectFromBackend } from "./ExportDefinitionsConverter.js";
import compact from "lodash/compact.js";
import { convertUserIdentifier } from "./UsersConverter.js";
import { convertFilter } from "./afm/FilterConverter.js";
import { convertMeasure } from "./afm/MeasureConverter.js";

function convertRecipient(
    userLinkage: JsonApiUserLinkage,
    included: JsonApiAutomationOutIncludes[],
): IAutomationRecipient | undefined {
    const linkedUser = included.find(
        (i) => i.type === "user" && i.id === userLinkage.id,
    ) as JsonApiUserOutWithLinks;
    if (!linkedUser) {
        return undefined;
    }

    const userFirstName = linkedUser.attributes?.firstname;
    const userLastName = linkedUser.attributes?.lastname;
    const userName = userFirstName && userLastName ? `${userFirstName} ${userLastName}` : undefined;
    return {
        type: "user",
        id: linkedUser.id,
        name: userName,
        email: linkedUser.attributes?.email,
    };
}

export function convertAutomation(
    automation: JsonApiAutomationOutWithLinks,
    included: JsonApiAutomationOutIncludes[],
): IAutomationMetadataObject {
    const { id, attributes = {}, relationships = {} } = automation;
    const { title, description, tags, schedule, alert, details, createdAt, modifiedAt, metadata, state } =
        attributes;
    const { createdBy, modifiedBy } = relationships;

    const notificationChannel = relationships?.notificationChannel?.data?.id;
    const exportDefinitionsIds = relationships?.exportDefinitions?.data?.map((ed) => ed.id) ?? [];
    const includedExportDefinitions = compact(
        exportDefinitionsIds.map((exportDefinitionId) =>
            included.find((i) => i.type === "exportDefinition" && i.id === exportDefinitionId),
        ),
    );

    const exportDefinitions = includedExportDefinitions.map((ed) =>
        convertExportDefinitionMdObjectFromBackend(ed as JsonApiExportDefinitionOutWithLinks),
    );

    const recipients =
        relationships?.recipients?.data
            ?.map((r) => convertRecipient(r, included))
            .filter(isAutomationUserRecipient) ?? [];

    const dashboard = relationships?.analyticalDashboard?.data?.id;

    const convertedAlert = convertAlert(alert, state);
    const alertObj = convertedAlert ? { alert: convertedAlert } : {};
    const scheduleObj = schedule ? { schedule } : {};
    const metadataObj = metadata ? { metadata } : {};

    return {
        // Core
        ...scheduleObj,
        ...alertObj,
        ...metadataObj,
        // Common metadata object properties
        type: "automation",
        id,
        ref: idRef(id, "automation"),
        uri: id,
        title: title ?? "",
        description: description ?? "",
        tags,
        // Details
        details,
        // Relationships
        exportDefinitions,
        recipients,
        notificationChannel,
        createdBy: convertUserIdentifier(createdBy, included),
        updatedBy: convertUserIdentifier(modifiedBy, included),
        created: createdAt,
        updated: modifiedAt,
        dashboard,
        // Bear legacy props
        unlisted: false,
        production: true,
        deprecated: false,
    };
}

export const convertAutomationListToAutomations = (
    automationList: JsonApiAutomationOutList,
): IAutomationMetadataObject[] => {
    return automationList.data.map((automationObject) =>
        convertAutomation(automationObject, automationList.included ?? []),
    );
};

const convertAlert = (
    alert: JsonApiAutomationInAttributesAlert | undefined,
    state: JsonApiAutomationOutAttributesStateEnum | undefined,
): IAutomationAlert | undefined => {
    if (!alert) {
        return undefined;
    }

    const { condition, execution } = alert;
    const comparison = (condition as ComparisonWrapper)?.comparison;
    const range = (condition as RangeWrapper)?.range;
    const relative = (condition as RelativeWrapper)?.relative;

    // TODO: we do not support RANGE for now
    if (range) {
        return undefined;
    }

    const base = {
        execution: {
            attributes: [], // TODO: not implemented on BE yet
            measures: execution.measures.map(convertMeasure),
            filters: execution.filters.map(convertFilter),
        },
        trigger: {
            state: state ?? "ACTIVE",
            mode: alert.trigger,
        },
    };

    if (comparison) {
        return {
            condition: {
                type: "comparison",
                operator: comparison.operator as IAlertComparisonOperator,
                left: comparison.left.localIdentifier,
                right: (comparison.right as any)?.value,
            },
            ...base,
        };
    }

    if (relative) {
        return {
            condition: {
                type: "relative",
                operator: relative.operator,
                measure: {
                    operator: relative.measure.operator,
                    left: relative.measure.left.localIdentifier,
                    right: relative.measure.right.localIdentifier,
                },
                threshold: relative.threshold.value,
            },
            ...base,
        };
    }

    return undefined;
};
