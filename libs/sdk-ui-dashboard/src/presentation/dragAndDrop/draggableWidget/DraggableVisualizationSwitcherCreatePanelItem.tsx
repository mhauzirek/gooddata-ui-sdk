// (C) 2024 GoodData Corporation

import React from "react";
import { VISUALIZATION_SWITCHER_WIDGET_SIZE_INFO_DEFAULT } from "@gooddata/sdk-ui-ext";

import { CustomCreatePanelItemComponent } from "../../componentDefinition/index.js";
import { DraggableCreatePanelItem } from "../DraggableCreatePanelItem.js";
import { DraggableItem, IWrapCreatePanelItemWithDragComponent } from "../types.js";

/**
 * @internal
 */
interface IDraggableRichTextCreatePanelItemProps {
    CreatePanelItemComponent: CustomCreatePanelItemComponent;
    WrapCreatePanelItemWithDragComponent?: IWrapCreatePanelItemWithDragComponent;
}

const dragItem: DraggableItem = {
    type: "visualizationSwitcherListItem",
    size: {
        gridHeight: VISUALIZATION_SWITCHER_WIDGET_SIZE_INFO_DEFAULT.height.default,
        gridWidth: VISUALIZATION_SWITCHER_WIDGET_SIZE_INFO_DEFAULT.width.default,
    },
};

/**
 * @internal
 */
export const DraggableVisualizationSwitcherCreatePanelItem: React.FC<
    IDraggableRichTextCreatePanelItemProps
> = ({ CreatePanelItemComponent, WrapCreatePanelItemWithDragComponent }) => {
    return (
        <DraggableCreatePanelItem
            Component={CreatePanelItemComponent}
            WrapCreatePanelItemWithDragComponent={WrapCreatePanelItemWithDragComponent}
            dragItem={dragItem}
            hideDefaultPreview={false}
        />
    );
};
