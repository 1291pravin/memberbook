declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
  }

  interface UserSession {
    // Must match users.session_version; bumping the column revokes older sessions.
    sessionVersion?: number
    // "<orgId>:<YYYY-MM-DD IST>" of the last day recorded in user_activity_days,
    // so the visit is written at most once per user, org and day.
    activityDay?: string
    admin?: {
      authenticated: boolean
      loggedInAt: string
    }
    currentOrg?: {
      orgId: number
      name: string
      slug: string
      type: string
      role: string
    }
  }
}

export {}
