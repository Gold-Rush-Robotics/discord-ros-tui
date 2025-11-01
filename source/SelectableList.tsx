import { Text } from "ink";
import React from "react";
import { Selection } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

interface SelectableListProps<T extends { id: string }> {
  title: string;
  items: T[] | null;
  selection?: Selection;
  selectionType: Selection["type"];
  interactable: boolean;
  isFocused: boolean;
  hoverIndex: number;
  formatItem: (item: T) => string;
  loadingMessage?: string;
}

function SelectableList<T extends { id: string }>({
  title,
  items,
  selection,
  selectionType,
  interactable,
  isFocused,
  hoverIndex,
  formatItem,
  loadingMessage,
}: SelectableListProps<T>) {
  if (!items) {
    return (
      <>
        <Text bold>{title}</Text>
        <Text>
          {loadingMessage ?? `Loading ${title.toLowerCase()}`}
          <LoadingDots />
        </Text>
      </>
    );
  }

  return (
    <>
      <Text bold>
        {title} ({items.length})
      </Text>
      {items.map((item, index) => {
        const isSelected =
          selection?.type === selectionType && selection?.id === item.id;
        const isHovered = interactable && isFocused && index === hoverIndex;

        if (isSelected) {
          return (
            <Text key={item.id} backgroundColor={"white"} color={"black"}>
              {formatItem(item)}
            </Text>
          );
        }
        if (isHovered) {
          return (
            <Text key={item.id} backgroundColor={"gray"} color={"white"}>
              {formatItem(item)}
            </Text>
          );
        }
        return <Text key={item.id}>{formatItem(item)}</Text>;
      })}
    </>
  );
}

export default SelectableList;
