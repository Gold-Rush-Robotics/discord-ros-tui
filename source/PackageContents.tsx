import { GuildMember, Role } from "discord.js";
import { Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";
import { getListCharacter, useMainContentDimensions } from "./utils.js";

function PackageContents({ pkg }: { pkg: string }) {
  const [role, setRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<GuildMember[] | null>(null);
  const { client, guild } = useDiscord();
  const { setTitle } = useSelection();

  useEffect(() => {
    async function fetchPackageContents() {
      const role = await client.guilds
        .fetch(guild)
        .then((guild) => guild.roles.fetch(pkg));

      setRole(role);
      setMembers(Array.from(role?.members.values() ?? []));
    }
    fetchPackageContents();
  }, [client, guild, pkg]);

  useEffect(() => {
    if (role?.name) {
      setTitle(<>Package info: /{role.name}</>);
    } else {
      setTitle(
        <>
          Package info: /<LoadingDots />
        </>
      );
    }
    return () => setTitle(null);
  }, [role?.name, setTitle]);

  const { height } = useMainContentDimensions();
  const maxMembers = Math.max(1, height - 2); // Reserve 2 lines for title and truncation message

  const visibleMembers = members ? members.slice(0, maxMembers) : [];
  const truncated = members ? Math.max(0, members.length - maxMembers) : 0;

  return (
    <>
      <Text bold>
        Nodes in package{" "}
        {role?.name ?? (
          <>
            (loading
            <LoadingDots />)
          </>
        )}
      </Text>
      {visibleMembers.map((member, index) => (
        <Text key={member.id}>
          {getListCharacter(index, members?.length ?? 0)} {member.displayName}
        </Text>
      ))}
      {truncated > 0 && <Text dimColor>... {truncated} more</Text>}
      {members && members.length === 0 && <Text>This package is empty :(</Text>}
    </>
  );
}

export default PackageContents;
