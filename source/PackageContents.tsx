import { GuildMember, Role } from "discord.js";
import { Text } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import LoadingDots from "./LoadingDots.js";
import { getListCharacter } from "./utils.js";

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
      {members?.map((member, index) => (
        <Text key={member.id}>
          {getListCharacter(index, members?.length ?? 0)} {member.displayName}
        </Text>
      ))}
      {members && members.length === 0 && <Text>This package is empty :(</Text>}
    </>
  );
}

export default PackageContents;
