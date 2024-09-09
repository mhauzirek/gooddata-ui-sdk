// (C) 2024 GoodData Corporation
import React from "react";
import { Dropdown, Button, List, SingleSelectListItem, OverlayPositionType } from "@gooddata/sdk-ui-kit";
import {
    IAlertComparisonOperator,
    IAlertRelativeArithmeticOperator,
    IAlertRelativeOperator,
} from "@gooddata/sdk-model";
import cx from "classnames";
import { FormattedMessage, useIntl } from "react-intl";

import { AlertMetric } from "../../types.js";

import { DROPDOWN_ITEM_HEIGHT, DROPDOWN_SEPARATOR_ITEM_HEIGHT, OPERATORS } from "./constants.js";
import { useOperators } from "./hooks/useOperators.js";

export interface IAlertComparisonOperatorSelectProps {
    measure: AlertMetric | undefined;
    selectedComparisonOperator: IAlertComparisonOperator | undefined;
    selectedRelativeOperator: [IAlertRelativeOperator, IAlertRelativeArithmeticOperator] | undefined;
    onComparisonOperatorChange: (comparisonOperator: IAlertComparisonOperator) => void;
    onRelativeOperatorChange: (
        relativeOperator: IAlertRelativeOperator,
        relativeArithmeticOperator: IAlertRelativeArithmeticOperator,
    ) => void;
    overlayPositionType?: OverlayPositionType;
}

export const AlertComparisonOperatorSelect = (props: IAlertComparisonOperatorSelectProps) => {
    const {
        selectedComparisonOperator,
        onComparisonOperatorChange,
        selectedRelativeOperator,
        onRelativeOperatorChange,
        overlayPositionType,
    } = props;
    const selectedComparisonItem = selectedComparisonOperator
        ? OPERATORS.find((option) => option.id === selectedComparisonOperator)!
        : undefined;
    const selectedRelativeItem = selectedRelativeOperator
        ? OPERATORS.find(
              (option) => option.id === `${selectedRelativeOperator[1]}.${selectedRelativeOperator[0]}`,
          )!
        : undefined;

    const intl = useIntl();

    const operators = useOperators(props.measure);

    return (
        <div className="gd-alert-comparison-operator-select">
            <Dropdown
                overlayPositionType={overlayPositionType}
                renderButton={({ isOpen, toggleDropdown }) => {
                    return (
                        <Button
                            className={cx(
                                "gd-alert-comparison-operator-select__button s-alert-operator-select",
                                {
                                    "is-active": isOpen,
                                },
                            )}
                            size="small"
                            variant="secondary"
                            iconLeft={selectedComparisonItem?.icon ?? selectedRelativeItem?.icon}
                            iconRight={`gd-icon-navigate${isOpen ? "up" : "down"}`}
                            onClick={toggleDropdown}
                        >
                            {intl.formatMessage({
                                id: selectedComparisonItem?.title ?? selectedRelativeItem?.title,
                            })}
                        </Button>
                    );
                }}
                renderBody={({ closeDropdown }) => {
                    return (
                        <List
                            className="gd-alert-comparison-operator-select__list s-alert-operator-select-list"
                            items={operators}
                            itemHeightGetter={(idx) =>
                                operators[idx].type === "separator"
                                    ? DROPDOWN_SEPARATOR_ITEM_HEIGHT
                                    : DROPDOWN_ITEM_HEIGHT
                            }
                            renderItem={(prop) => {
                                return (
                                    <SingleSelectListItem
                                        key={prop.rowIndex}
                                        type={prop.item.type}
                                        icon={
                                            prop.item.icon ? (
                                                <div
                                                    className={cx(
                                                        "gd-alert-comparison-operator-select__icon",
                                                        prop.item.icon,
                                                    )}
                                                />
                                            ) : undefined
                                        }
                                        title={
                                            prop.item.title
                                                ? intl.formatMessage({ id: prop.item.title })
                                                : undefined
                                        }
                                        info={
                                            prop.item.info ? (
                                                <FormattedMessage
                                                    id={prop.item.info}
                                                    values={{
                                                        spacer: (
                                                            <div className="gd-alert-comparison-operator-tooltip-spacer" />
                                                        ),
                                                    }}
                                                />
                                            ) : undefined
                                        }
                                        isSelected={
                                            prop.item === selectedComparisonItem ||
                                            prop.item === selectedRelativeItem
                                        }
                                        onClick={() => {
                                            const [first, second] = prop.item.id.split(".");
                                            if (first && !second) {
                                                onComparisonOperatorChange(first);
                                            }
                                            if (first && second) {
                                                onRelativeOperatorChange(
                                                    second as IAlertRelativeOperator,
                                                    first as IAlertRelativeArithmeticOperator,
                                                );
                                            }
                                            closeDropdown();
                                        }}
                                    />
                                );
                            }}
                        />
                    );
                }}
            />
        </div>
    );
};