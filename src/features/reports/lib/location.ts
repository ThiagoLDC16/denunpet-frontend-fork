// A localização é salva como "latitude, longitude". Denúncias antigas podem ter texto livre.
export function parseLocation(location: string): [number, number] | null {
    const parts = location.split(',').map(part => part.trim());
    if (parts.length !== 2 || parts.some(part => part === '')) return null;

    const [lat, lng] = parts.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    return [lat, lng];
}
