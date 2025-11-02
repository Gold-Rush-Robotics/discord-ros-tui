import { GuildMember } from "discord.js";
import { useInput } from "ink";
import React, { useEffect, useMemo, useState } from "react";
import {
  useDiscord,
  useMessages,
  useSelection,
} from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import SelectableList from "./SelectableList.js";
import { sidebarItemInputHandler } from "./utils.js";

function Services({ interactable }: { interactable: boolean }) {
  const [services, setServices] = useState<GuildMember[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const { selection, setSelection } = useSelection();
  const { client, guild } = useDiscord();
  const messagesByChannel = useMessages();

  const { isCarouselItemActive } = useFocusManager();
  const isFocused = isCarouselItemActive("services");

  function handleReturn(selectedIndex: number) {
    setSelection({ id: services?.[selectedIndex]?.id ?? "", type: "service" });
  }

  useInput((_input, key) => {
    if (!interactable || !isFocused || !services) {
      return;
    }
    sidebarItemInputHandler(
      key,
      hoverIndex,
      setHoverIndex,
      handleReturn,
      services
    );
  });

  // Extract mentioned user IDs from cached messages
  const mentionedUserIds = useMemo(() => {
    if (!(messagesByChannel instanceof Map) || messagesByChannel.size === 0) {
      return new Set<string>();
    }

    const userIds = new Set<string>();
    for (const messages of messagesByChannel.values()) {
      for (const message of messages) {
        for (const user of message.mentions.users.values()) {
          userIds.add(user.id);
        }
      }
    }
    return userIds;
  }, [messagesByChannel]);

  // Fetch guild members for mentioned users
  useEffect(() => {
    if (mentionedUserIds.size === 0) {
      setServices([]);
      return;
    }

    async function fetchServiceMembers() {
      try {
        const guildObj = await client.guilds.fetch(guild);
        const fetchPromises = Array.from(mentionedUserIds).map(
          async (userId) => {
            try {
              return await guildObj.members.fetch(userId);
            } catch {
              // Skip users that are no longer in the guild
              return null;
            }
          }
        );
        const mentionedMembers = (await Promise.all(fetchPromises)).filter(
          (member): member is GuildMember => member !== null
        );
        setServices(mentionedMembers);
      } catch (error) {
        setServices([]);
      }
    }
    fetchServiceMembers();
  }, [client, guild, mentionedUserIds]);

  return (
    <SelectableList
      title="Services"
      items={services}
      selection={selection}
      selectionType="service"
      interactable={interactable}
      isFocused={isFocused}
      hoverIndex={hoverIndex}
      loadingMessage="Loading services"
      formatItem={(service) => `/${service.displayName}`}
      isCarousel={true}
    />
  );
}

export default Services;
