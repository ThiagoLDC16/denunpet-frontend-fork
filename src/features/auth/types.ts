export interface User {
    id: number
    email: string
    name: string
    type: UserType
}

// Objeto const em vez de enum: o tsconfig usa erasableSyntaxOnly, que não permite enum
export const UserType = {
    USER: 'USER',
    ONG: 'ONG',
} as const;

export type UserType = typeof UserType[keyof typeof UserType];
