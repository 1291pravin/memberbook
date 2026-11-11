declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
  }

  interface UserSession {
    // Must match users.session_version; bumping the column revokes older sessions.
    sessionVersion?: number
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
