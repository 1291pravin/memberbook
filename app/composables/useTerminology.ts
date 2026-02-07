export function useTerminology() {
  const { currentOrg } = useOrg();

  return computed(() => {
    const isTuition = currentOrg.value?.type === "tuition";

    return {
      member: isTuition ? "Student" : "Member",
      members: isTuition ? "Students" : "Members",
      memberLower: isTuition ? "student" : "member",
      membersLower: isTuition ? "students" : "members",
      addMember: isTuition ? "Add Student" : "Add Member",
      noMembers: isTuition ? "No students yet" : "No members yet",
      importMembers: isTuition ? "Import Students" : "Import Members",
    };
  });
}
