import { Role } from "discord.js";
import { useInput } from "ink";
import React, { useEffect, useState } from "react";
import { useDiscord, useSelection } from "./DiscordClientProvider.js";
import { useFocusManager } from "./FocusManager.js";
import SelectableList from "./SelectableList.js";
import { sidebarItemInputHandler } from "./utils.js";

function Packages({ interactable }: { interactable: boolean }) {
  const [packages, setPackages] = useState<Role[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const { selection, setSelection } = useSelection();
  const { client, guild } = useDiscord();

  const { isCarouselItemActive } = useFocusManager();
  const isFocused = isCarouselItemActive("packages");

  function handleReturn(selectedIndex: number) {
    setSelection({ id: packages?.[selectedIndex]?.id ?? "", type: "package" });
  }

  useInput((_input, key) => {
    if (!interactable || !isFocused || !packages) {
      return;
    }
    sidebarItemInputHandler(
      key,
      hoverIndex,
      setHoverIndex,
      handleReturn,
      packages
    );
  });

  // Fetch all "packages" (roles) from the guild
  useEffect(() => {
    async function fetchPackages() {
      const guildObj = await client.guilds.fetch(guild);
      const roles = await guildObj.roles.fetch();
      setPackages(Array.from(roles.values()));
    }
    fetchPackages();
  }, [client, guild]);

  return (
    <SelectableList
      title="Packages"
      items={packages}
      selection={selection}
      selectionType="package"
      interactable={interactable}
      isFocused={isFocused}
      hoverIndex={hoverIndex}
      loadingMessage="Loading packages"
      formatItem={(pkg) => `/${pkg.name}`}
      isCarousel={true}
    />
  );
}

export default Packages;
