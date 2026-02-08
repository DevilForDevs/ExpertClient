// secureRandom.ts
import SecureRandomModule from 'react-native-securerandom';

// react-native-securerandom exports a default function, not `randomBytes`
// We'll wrap it for TypeScript
export async function getRandomBytes(length: number): Promise<number[]> {
  // @ts-ignore: ignore missing TS types
  return SecureRandomModule(length) as number[];
}

