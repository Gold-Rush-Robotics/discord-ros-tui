import { Box, Text, useStdout } from "ink";
import React, { useState, useEffect } from "react";
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
  isCarousel?: boolean;
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
  isCarousel = false,
}: SelectableListProps<T>) {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [height, setHeight] = useState(
    Math.max(0, Math.floor((stdout.rows - 6) / 2) - 2)
  );

  useEffect(() => {
    function Resize() {
      setHeight(Math.max(0, Math.floor((stdout.rows - 6) / 2)) - 2);
    }

    stdout.on("resize", Resize);
    return () => {
      stdout.off("resize", Resize);
    };
  }, [stdout]);

  useEffect(() => {
    if (!items || height <= 0) {
      setScrollOffset(0);
      return;
    }

    let newOffset = scrollOffset;

    if (hoverIndex < scrollOffset) {
      // If hover is behind offset, set offset to hover index.
      newOffset = hoverIndex;
    } else if (hoverIndex >= scrollOffset + height) {
      // If hoverIndex is ahead of visible elements,
      // calculate the new offset to position the hovered item at the bottom.
      newOffset = hoverIndex - height + 1;
    }

    // Confines the offset.
    const maxOffset = Math.max(0, items.length - height);
    newOffset = Math.min(Math.max(0, newOffset), maxOffset);

    if (newOffset !== scrollOffset) {
      setScrollOffset(newOffset);
    }
  }, [hoverIndex, height, items, scrollOffset]);

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

  const visibleItems = items.slice(scrollOffset, scrollOffset + height);

  return (
    <>
      {isCarousel && interactable ? (
        <Box flexDirection="row" width="100%">
          <Text bold>{`<`}</Text>
          <Box flexGrow={1} justifyContent="center">
            <Text bold>{`   ${title} (${items.length})   `}</Text>
          </Box>
          <Text bold>{`>`}</Text>
        </Box>
      ) : (
        <Text bold>
          {title} ({items.length})
        </Text>
      )}

      {visibleItems.map((item, index) => {
        const realIndex = index + scrollOffset;
        const isSelected =
          selection?.type === selectionType && selection?.id === item.id;
        const isHovered = interactable && isFocused && realIndex === hoverIndex;

        const isLastVisibleItem = index === visibleItems.length - 1;
        const moreItemsAvailable = scrollOffset + height < items.length;
        let itemFormatted = formatItem(item);

        if (isLastVisibleItem && moreItemsAvailable) {
          // Add "..." if scrollable/more items available.
          itemFormatted = itemFormatted.trim() + "...";
        }

        if (isSelected) {
          return (
            <Text key={item.id} wrap="truncate" backgroundColor={"white"} color={"black"}>
              {itemFormatted}
            </Text>
          );
        }
        if (isHovered) {
          return (
            <Text key={item.id} wrap="truncate" backgroundColor={"gray"} color={"white"}>
              {itemFormatted}
            </Text>
          );
        }
        return <Text key={item.id} wrap="truncate">{itemFormatted}</Text>;
      })}
    </>
  );
}

export default SelectableList;
