import { ChannelType, GuildMember, TextChannel } from "discord.js";
import { useInput } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import SelectableList from "./SelectableList.js";
import { sidebarItemInputHandler } from "./utils.js";

function Services({ interactable }: { interactable: boolean }) {
  const [services, setServices] = useState<GuildMember[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const { selection, setSelection } = useSelection();
  const { client, guild } = useDiscord();

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

  // Fetch all "services" (mentioned users) from the guild
  useEffect(() => {
    async function fetchServices() {
      const guildObj = await client.guilds.fetch(guild);
      const channels = await guildObj.channels.fetch();
      const textChannels = Array.from(channels.values()).filter(
        (channel) =>
          channel !== null &&
          channel.type === ChannelType.GuildText &&
          channel instanceof TextChannel
      ) as TextChannel[];

      const mentionedUserIds = new Set<string>();

      // Fetch recent messages from all text channels and collect mentioned users
      for (const channel of textChannels) {
        try {
          const messages = await channel.messages.fetch({ limit: 50 });
          for (const message of messages.values()) {
            // Collect mentioned users
            for (const user of message.mentions.users.values()) {
              mentionedUserIds.add(user.id);
            }
          }
        } catch (error) {
          // Skip channels we can't access
          continue;
        }
      }

      // Fetch guild members for mentioned users
      const mentionedMembers: GuildMember[] = [];
      for (const userId of mentionedUserIds) {
        try {
          const member = await guildObj.members.fetch(userId);
          mentionedMembers.push(member);
        } catch (error) {
          // Skip users that are no longer in the guild
          continue;
        }
      }

      setServices(mentionedMembers);
    }
    fetchServices();
  }, [client, guild]);

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
