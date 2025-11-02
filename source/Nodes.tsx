import { GuildMember } from "discord.js";
import { useInput } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import SelectableList from "./SelectableList.js";
import { sidebarItemInputHandler } from "./utils.js";

function Nodes({ interactable }: { interactable: boolean }) {
  const [nodes, setNodes] = useState<GuildMember[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const { selection, setSelection } = useSelection();
  const { client, guild } = useDiscord();

  const { isCarouselItemActive } = useFocusManager();
  const isFocused = isCarouselItemActive("node");

  function handleReturn(selectedIndex: number) {
    setSelection({ id: nodes?.[selectedIndex]?.id ?? "", type: "node" });
  }

  useInput((_input, key) => {
    if (!interactable || !isFocused || !nodes) {
      return;
    }
    sidebarItemInputHandler(
      key,
      hoverIndex,
      setHoverIndex,
      handleReturn,
      nodes
    );
  });

  // Fetch all "nodes" (users) from the guild
  useEffect(() => {
    async function fetchNodes() {
      const guildObj = await client.guilds.fetch(guild);
      const members = await guildObj.members.fetch();
      setNodes(Array.from(members.values()));
    }
    fetchNodes();
  }, [client, guild]);

  return (
    <SelectableList
      title="Nodes"
      items={nodes}
      selection={selection}
      selectionType="node"
      interactable={interactable}
      isFocused={isFocused}
      hoverIndex={hoverIndex}
      loadingMessage="Loading nodes"
      formatItem={(node) => `/${node.displayName}`}
      isCarousel={true}
    />
  );
}

export default Nodes;
