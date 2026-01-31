declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
  }

  interface UserSession {
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
