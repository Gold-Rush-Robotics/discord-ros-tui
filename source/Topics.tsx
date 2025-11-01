import { ChannelType, GuildChannel } from "discord.js";
import { useInput } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import SelectableList from "./SelectableList.js";
import { sidebarItemInputHandler } from "./utils.js";

function Topics({ interactable }: { interactable: boolean }) {
  const [topics, setTopics] = useState<GuildChannel[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const { selection, setSelection } = useSelection();
  const { client, guild } = useDiscord();

  const { isFocused } = useFocusManager();

  function handleReturn(selectedIndex: number) {
    setSelection({ id: topics?.[selectedIndex]?.id ?? "", type: "topic" });
  }

  useInput((_input, key) => {
    if (!interactable || !isFocused("topics") || !topics) {
      return;
    }
    sidebarItemInputHandler(
      key,
      hoverIndex,
      setHoverIndex,
      handleReturn,
      topics
    );
  });

  // Fetch all "topics" (channels) from the guild
  useEffect(() => {
    async function fetchTopics() {
      const guildObj = await client.guilds.fetch(guild);
      const channels = await guildObj.channels.fetch();
      setTopics(
        Array.from(channels.values()).filter(
          (channel) =>
            channel !== null && channel.type === ChannelType.GuildText
        )
      );
    }
    fetchTopics();
  }, [client, guild]);

  return (
    <SelectableList
      title="Topics"
      items={topics}
      selection={selection}
      selectionType="topic"
      interactable={interactable}
      isFocused={isFocused("topics")}
      hoverIndex={hoverIndex}
      loadingMessage="Loading topics"
      formatItem={(topic) => `/${topic.name}`}
    />
  );
}

export default Topics;
