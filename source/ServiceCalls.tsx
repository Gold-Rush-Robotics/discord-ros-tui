import {
  ChannelType,
  Collection,
  GuildMember,
  Message,
  Snowflake,
  TextChannel,
} from "discord.js";
import { Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";

function ServiceCalls({ service }: { service: string }) {
  const [serviceCalls, setServiceCalls] = useState<Message[] | null>(null);
  const [serviceMember, setServiceMember] = useState<GuildMember | null>(null);
  const { client, guild } = useDiscord();

  // Fetch recent calls to the service (i.e. messages mentioning the service/user)
  useEffect(() => {
    setServiceMember((_prev) => null);
    setServiceCalls((_prev) => null);

    async function fetchServiceCalls() {
      const [guildObj, fetchedService] = await Promise.all([
        client.guilds.fetch(guild),
        client.guilds.fetch(guild).then((g) => g.members.fetch(service)),
      ]);

      setServiceMember(fetchedService);

      const channels = await guildObj.channels.fetch();
      const textChannels = Array.from(channels.values()).filter(
        (channel) =>
          channel !== null &&
          channel.type === ChannelType.GuildText &&
          channel instanceof TextChannel
      ) as TextChannel[];

      const fetchPromises = textChannels.map((channel) =>
        channel.messages
          .fetch({ limit: 100 })
          .catch(() => new Collection<Snowflake, Message>())
      );

      const results = await Promise.all(fetchPromises);

      const serviceCalls: Message[] = results
        .flatMap((messages) => Array.from(messages.values()))
        .filter(
          (message) =>
            message.mentions &&
            (message.mentions.users.has(service) ||
              message.author.id === service)
        );

      serviceCalls.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      setServiceCalls(serviceCalls);
    }

    fetchServiceCalls();
  }, [client, guild, service]);

  return (
    <>
      <Text bold>
        Service Calls for service{" "}
        {serviceMember?.displayName ?? (
          <>
            (loading
            <LoadingDots />)
          </>
        )}
      </Text>
      {serviceCalls === null && (
        <Text>
          Loading service calls
          <LoadingDots />
        </Text>
      )}
      {serviceCalls?.length === 0 && (
        <Text>No recent calls to/from this service.</Text>
      )}
      {serviceCalls?.map((call) => {
        const sender = call.author;
        const receiver =
          call.author.id === service
            ? serviceMember
            : call.mentions.users.at(0);
        return (
          <Text key={call.id}>
            [{call.createdAt.toLocaleString()}]{" "}
            <Text bold>{sender.displayName}</Text> {"->"}{" "}
            <Text bold>{receiver?.displayName}</Text> {call.content}
          </Text>
        );
      })}
    </>
  );
}

export default ServiceCalls;
