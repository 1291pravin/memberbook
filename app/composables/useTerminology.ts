export function useTerminology() {
  const { currentOrg } = useOrg();

  return computed(() => {
    const type = currentOrg.value?.type;
    const [one, many] = type === "tuition"
      ? ["Student", "Students"]
      : type === "clinic"
        ? ["Patient", "Patients"]
        : ["Member", "Members"];

    return {
      member: one,
      members: many,
      memberLower: one.toLowerCase(),
      membersLower: many.toLowerCase(),
      addMember: `Add ${one}`,
      noMembers: `No ${many.toLowerCase()} yet`,
      importMembers: `Import ${many}`,
    };
  });
}
