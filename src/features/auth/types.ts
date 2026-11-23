export interface User {
    id: number
    email: string
    name: string
    type: UserType
}

export const UserType = {
    USER: 'USER',
    ONG: 'ONG',
} as const;

export type UserType = typeof UserType[keyof typeof UserType];
