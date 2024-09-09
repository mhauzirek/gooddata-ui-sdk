// (C) 2024 GoodData Corporation

import * as React from "react";
import { ITheme } from "@gooddata/sdk-model";
import { useTheme } from "@gooddata/sdk-ui-theme-provider";
import { ListItem, ListItemProps } from "./types.js";
import classnames from "classnames";

export type SearchListItemProps<T> = ListItemProps<T> &
    React.PropsWithChildren<{
        renderIcon: (item: ListItem<T>, theme?: ITheme) => React.ReactElement;
        renderDetails?: (item: ListItem<T>, theme?: ITheme) => React.ReactElement;
        className?: string;
    }>;

/**
 * A single result item in the search results.
 * @internal
 */
export const SearchListItem = <T,>({
    listItem,
    isActive,
    setActive,
    onSelect,
    renderIcon,
    renderDetails,
    className,
    children,
}: SearchListItemProps<T>) => {
    const theme = useTheme();
    const onPointerOver = () => setActive(listItem);
    const onClick = (e: React.MouseEvent) => {
        if (e.button < 2) {
            // Only report left and middle clicks
            onSelect(listItem, e.nativeEvent);
        }
    };
    const Tag = listItem.url ? "a" : "span";
    const wrapperClassName = classnames(className, {
        "gd-semantic-search__results-item": true,
        "gd-semantic-search__results-item--active": isActive,
    });

    return (
        <Tag
            href={listItem.url}
            className={wrapperClassName}
            onPointerOver={onPointerOver}
            onClick={onClick}
            onAuxClick={onClick}
        >
            <span className="gd-semantic-search__results-item__icon">{renderIcon(listItem, theme)}</span>
            <span className="gd-semantic-search__results-item__text">{children}</span>
            {renderDetails && isActive ? renderDetails(listItem, theme) : null}
        </Tag>
    );
};